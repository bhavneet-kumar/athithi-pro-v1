/* eslint-disable complexity */
import { NextFunction, Request } from 'express';
import { ClientSession, Schema, Types } from 'mongoose';

import { TRACKED_FIELDS, isModelTracked } from '../constant/changeLog';
import { ChangeLog } from '../models/changeLog.model';

interface AuditInfo {
  createdAt: Date;
  createdBy: Types.ObjectId;
  updatedAt: Date;
  updatedBy: Types.ObjectId;
  version: number;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
}

interface AuditableDocument {
  _id: Types.ObjectId;
  audit?: AuditInfo;
  isNew?: boolean;
  $session?: ClientSession;
  $oldDoc?: AuditableDocument;
  $req?: Request;
  constructor: {
    modelName: string;
  };
  toObject(): Record<string, unknown>;
}

interface ChangeData {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

interface ChangeLogMetadata {
  ip?: string;
  userAgent?: string;
  location?: string;
  [key: string]: unknown;
}

interface LogChangeOptions {
  req?: Request;
  session?: ClientSession;
  ipAddress?: string;
  userAgent?: string;
}

// Simple value equality check
const isEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) {
    return true;
  }
  if (typeof a !== typeof b) {
    return false;
  }
  if (a === null || b === null) {
    return a === b;
  }

  // For complex objects, convert to string for simple comparison
  if (typeof a === 'object' && typeof b === 'object') {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  return false;
};

// Enhanced nested property access with type safety
const getNestedProperty = <T>(obj: Record<string, unknown>, path: string): T | null => {
  if (!obj || typeof obj !== 'object') {
    return null;
  }

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return null;
    }
    const value = current[key as keyof typeof current];
    if (typeof value === 'object' && value !== null) {
      current = value as Record<string, unknown>;
    } else {
      return value as T;
    }
  }

  return current as T;
};

// Detect changes between documents
const detectChanges = (
  newDoc: AuditableDocument,
  oldDoc: AuditableDocument | null,
  trackedFields: readonly string[],
  _operation: 'CREATE' | 'UPDATE',
): ChangeData[] => {
  const changes: ChangeData[] = [];

  for (const field of trackedFields) {
    const newValue = getNestedProperty(newDoc.toObject(), field);
    const oldValue = oldDoc ? getNestedProperty(oldDoc.toObject(), field) : null;

    if (!isEqual(newValue, oldValue)) {
      changes.push({
        field,
        oldValue,
        newValue,
      });
    }
  }

  return changes;
};

// Create metadata object from request
const createMetadata = (options: LogChangeOptions): ChangeLogMetadata => ({
  ip: options.ipAddress || options.req?.ip,
  userAgent: options.userAgent || options.req.headers['user-agent'],
});

// Log changes to the database
const logChange = async (
  doc: AuditableDocument,
  oldDoc: AuditableDocument | null,
  operation: 'CREATE' | 'UPDATE',
  options: LogChangeOptions,
): Promise<void> => {
  const { constructor, _id } = doc;
  const { modelName } = constructor;

  if (!modelName || !isModelTracked(modelName)) {
    return;
  }

  const trackedFields = TRACKED_FIELDS[modelName as keyof typeof TRACKED_FIELDS];
  const changes = detectChanges(doc, oldDoc, trackedFields, operation);

  if (changes.length === 0 && operation === 'UPDATE') {
    return; // No changes to log
  }

  const { audit } = doc;

  const changedBy = audit?.updatedBy || audit?.createdBy;
  if (!changedBy) {
    return; // No user context available
  }

  const metadata = createMetadata(options);

  try {
    const changeLogEntry = new ChangeLog({
      entityId: _id,
      entityType: modelName,
      operation,
      changes,
      changedBy,
      metadata,
    });

    await changeLogEntry.save({ session: options.session });
  } catch (error) {
    console.error('[ChangeLog] Failed to create change log entry:', error);
  }
};

// Set up post-save hook for a model

export const setUpPostSaveHook = (modelSchema: Schema): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modelSchema.post('save', async function (this: any, next: NextFunction) {
    try {
      const session = this?.$locals?.session;
      const req = this?.$locals?.req;
      const oldDoc = this?.$locals?.oldDoc;
      const isNew = this?.$locals?.isNew;

      const ipAddress = req?.ip;
      const userAgent = req?.headers?.['user-agent'];

      // Skip oldDoc retrieval for CREATE operations
      const originalDoc = isNew ? null : oldDoc;

      await logChange(this as AuditableDocument, originalDoc, isNew ? 'CREATE' : 'UPDATE', {
        ipAddress,
        userAgent,
        session,
        req,
      });
    } catch (error) {
      console.error('[ChangeLog] Error in post-save hook:', error);
      next(error);
    }
  });
};

export const setUpPostUpdateHook = (modelSchema: Schema): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modelSchema.post('updateOne', async function (this: any, result: any, next: NextFunction) {
    try {
      const { req, session, oldDoc } = this.getOptions().context;

      const updatedDoc = result.toObject() || null;

      const ipAddress = req?.ip;
      const userAgent = req?.headers?.['user-agent'];

      if (!oldDoc || !updatedDoc) {
        throw new Error('Original or updated document not found');
      }

      await logChange(updatedDoc as AuditableDocument, oldDoc, 'UPDATE', {
        ipAddress,
        userAgent,
        session,
        req,
      });

      next();
    } catch (error) {
      console.error('[ChangeLog] Error in post-update hook:', error);
      next(error);
    }
  });
};

export const initChangeLogMiddleware = (modelSchema: Schema): void => {
  setUpPostSaveHook(modelSchema);
  setUpPostUpdateHook(modelSchema);
};

export interface PluginMetaForSave {
  $session?: ClientSession;
  $req?: Request;
  $oldDoc?: unknown;
}
