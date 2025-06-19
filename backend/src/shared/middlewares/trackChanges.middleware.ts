/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request } from 'express';
import { Document, Model, Types, ClientSession } from 'mongoose';

import { CLEANUP_INTERVAL_MS, isModelTracked, MAX_MAP_SIZE, TRACKED_FIELDS } from '../constant/changeLog';
import { ChangeLog } from '../models/changeLog.model';

/**
 * Transaction-Aware Change Tracking Middleware
 *
 * This middleware provides comprehensive audit trail support for MongoDB operations
 * with full transaction support and session isolation.
 *
 * Features:
 * - Transaction-aware change logging
 * - Session isolation to prevent race conditions
 * - Automatic rollback of audit logs on transaction failure
 * - Support for all CRUD operations
 * - Soft delete tracking
 *
 * Usage Examples:
 *
 * 1. Basic Model Setup:
 * ```typescript
 * import { applyChangeTracking } from './trackChanges.middleware';
 * import { Lead } from './lead.model';
 *
 * // Apply tracking to model
 * applyChangeTracking(Lead);
 * ```
 *
 * 2. Transaction Usage:
 * ```typescript
 * import { withTransactionAudit } from './trackChanges.middleware';
 *
 * await withTransactionAudit(async (session) => {
 *   const lead = new Lead({ name: 'John Doe' });
 *   await lead.save({ session });
 *
 *   await Lead.findByIdAndUpdate(
 *     lead._id,
 *     { status: 'contacted' },
 *     { session }
 *   );
 * }, req);
 * ```
 *
 * 3. Manual Logging:
 * ```typescript
 * import { manualChangeLog } from './trackChanges.middleware';
 *
 * await manualChangeLog(
 *   document,
 *   'UPDATE',
 *   originalDocument,
 *   { req, session }
 * );
 * ```
 */

// Type definitions
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

interface AuditableDocument extends Document {
  audit?: AuditInfo;
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

interface ChangeLogEntryParams {
  entityId: Types.ObjectId;
  entityType: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE';
  changes: ChangeData[];
  changedBy: Types.ObjectId | undefined;
  metadata: ChangeLogMetadata;
  session?: ClientSession;
}

interface LogChangeOptions {
  req?: Request;
  session?: ClientSession;
}

// Error reporting utility
const reportError = (error: unknown, context: string, metadata?: Record<string, unknown>): void => {
  console.error(`[ChangeTracker] ${context}:`, error, metadata);
  // TODO: Integrate with error monitoring service
};

// Transaction-aware change tracking context
class ChangeTrackingContext {
  private static instance: ChangeTrackingContext;
  private originals = new Map<string, { doc: AuditableDocument; timestamp: number; sessionId?: string }>();
  private readonly MAX_MAP_SIZE = MAX_MAP_SIZE;
  private readonly CLEANUP_INTERVAL_MS = CLEANUP_INTERVAL_MS; // 1 hour

  private constructor() {
    // Setup periodic cleanup
    setInterval(() => this.cleanupOldEntries(), this.CLEANUP_INTERVAL_MS);
  }

  public static getInstance(): ChangeTrackingContext {
    if (!ChangeTrackingContext.instance) {
      ChangeTrackingContext.instance = new ChangeTrackingContext();
    }
    return ChangeTrackingContext.instance;
  }

  storeOriginal(id: string, doc: AuditableDocument, session?: ClientSession): void {
    if (this.originals.size >= this.MAX_MAP_SIZE) {
      this.cleanupOldEntries();
    }
    const sessionId = session?.id?.toString();
    const key = sessionId ? `${id}:${sessionId}` : id;
    this.originals.set(key, { doc, timestamp: Date.now(), sessionId });
  }

  getOriginal(id: string, session?: ClientSession): AuditableDocument | null {
    const sessionId = session?.id?.toString();
    const key = sessionId ? `${id}:${sessionId}` : id;
    const entry = this.originals.get(key) || this.originals.get(id); // Fallback to non-session key

    if (entry) {
      entry.timestamp = Date.now(); // Update last accessed time
      return entry.doc;
    }
    return null;
  }

  clearOriginal(id: string, session?: ClientSession): void {
    const sessionId = session?.id?.toString();
    const key = sessionId ? `${id}:${sessionId}` : id;
    this.originals.delete(key);
    // Also clear non-session key as fallback
    this.originals.delete(id);
  }

  private cleanupOldEntries(): void {
    const now = Date.now();
    const cutoff = now - this.CLEANUP_INTERVAL_MS;

    for (const [id, entry] of this.originals.entries()) {
      if (entry.timestamp < cutoff) {
        this.originals.delete(id);
      }
    }
  }
}

// Enhanced nested property access with type safety
const getNestedProperty = <T>(obj: any, path: string): T | null => {
  if (!obj || typeof obj !== 'object') {
    return null;
  }

  const keys = path.split('.');
  let result: any = obj;

  for (const key of keys) {
    if (!result || typeof result !== 'object') {
      return null;
    }
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      result = Reflect.get(result, key);
    } else {
      return null;
    }
  }

  return result as T;
};

// Improved deep equality check
const isEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) {
    return true;
  }
  if (typeof a !== typeof b) {
    return false;
  }

  if (typeof a === 'object' && a !== null && b !== null) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    for (const key of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) {
        return false;
      }
      const aValue = Reflect.get(a as object, key);
      const bValue = Reflect.get(b as object, key);
      if (!isEqual(aValue, bValue)) {
        return false;
      }
    }
    return true;
  }

  return false;
};

// Helper function to detect changes between old and new documents
const detectChanges = (
  newDoc: AuditableDocument,
  oldDoc: AuditableDocument | null,
  trackedFields: readonly string[],
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE',
): ChangeData[] => {
  const changes: ChangeData[] = [];

  if (operation === 'DELETE' || operation === 'SOFT_DELETE') {
    return changes;
  }

  for (const field of trackedFields) {
    const oldValue = oldDoc ? getNestedProperty(oldDoc, field) : null;
    const newValue = getNestedProperty(newDoc, field);

    if (!isEqual(oldValue, newValue)) {
      changes.push({ field, oldValue, newValue });
    }
  }

  return changes;
};

// Helper function to create metadata from request
const createMetadata = (req?: Request): ChangeLogMetadata => ({
  ip: req?.ip,
  userAgent: req?.headers['user-agent'],
  location: req?.headers['x-geo-location'] as string | undefined,
});

// Helper function to extract session from document or query
const extractSession = (docOrQuery: any): ClientSession | null => {
  // Try to get session from document
  if (docOrQuery.$session) {
    return docOrQuery.$session();
  }

  // Try to get session from query
  if (docOrQuery.getOptions && typeof docOrQuery.getOptions === 'function') {
    const options = docOrQuery.getOptions();
    return options?.session ?? null;
  }

  // Try to get session from document's $session property
  return docOrQuery.session ?? null;
};

// Helper function to create change log entry with transaction support
const createChangeLogEntry = async (params: ChangeLogEntryParams): Promise<void> => {
  const { entityId, entityType, operation, changes, changedBy, metadata, session } = params;

  // Skip logging if changedBy is not available (required field)
  if (!changedBy) {
    return;
  }

  try {
    const changeLogData = {
      entityId,
      entityType,
      operation: operation === 'SOFT_DELETE' ? 'UPDATE' : operation,
      changes,
      changedBy,
      metadata,
      changedAt: new Date(),
    };

    await (session ? ChangeLog.create([changeLogData], { session }) : ChangeLog.create(changeLogData));
  } catch (error) {
    reportError(error, 'Failed to create ChangeLog entry', {
      entityId,
      entityType,
      hasSession: !!session,
    });
    // Re-throw error in transaction context to ensure rollback
    if (session) {
      throw error;
    }
  }
};

// Main change logging function with transaction support
const logChange = async (
  newDoc: AuditableDocument,
  oldDoc: AuditableDocument | null,
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE',
  options?: LogChangeOptions,
): Promise<void> => {
  const { constructor, _id } = newDoc;
  const { modelName } = constructor as any;

  if (!modelName || !isModelTracked(modelName)) {
    return;
  }

  const trackedFields = TRACKED_FIELDS[modelName as keyof typeof TRACKED_FIELDS];
  const changes = detectChanges(newDoc, oldDoc, trackedFields, operation);
  const metadata = createMetadata(options?.req);
  const { audit: auditInfo } = newDoc;
  const changedBy = auditInfo?.updatedBy || auditInfo?.createdBy;

  await createChangeLogEntry({
    entityId: _id as Types.ObjectId,
    entityType: modelName,
    operation,
    changes,
    changedBy,
    metadata,
    session: options?.session,
  });
};

// Hook setup functions with transaction support
const setupPreHooks = (model: Model<AuditableDocument>): void => {
  const context = ChangeTrackingContext.getInstance();

  model.schema.pre(['findOneAndUpdate', 'updateOne'], async function () {
    try {
      const id = this.getQuery()._id;
      const session = extractSession(this);

      if (id) {
        const findOptions: any = {};
        if (session) {
          findOptions.session = session;
        }

        const originalDoc = await model.findById(id, null, findOptions).lean();
        if (originalDoc) {
          context.storeOriginal(id.toString(), originalDoc as AuditableDocument, session);
        }
      }
    } catch (error) {
      reportError(error, 'pre-hook findOneAndUpdate', { model: model.modelName });
    }
  });
};

const setupPostHooks = (model: Model<AuditableDocument>, req?: Request): void => {
  const context = ChangeTrackingContext.getInstance();

  // Save hook (for new documents and direct saves)
  model.schema.post('save', async (doc: AuditableDocument) => {
    try {
      const { isNew } = doc as any;
      const session = extractSession(doc);

      await logChange(
        doc,
        isNew ? null : context.getOriginal(doc._id.toString(), session) || null,
        isNew ? 'CREATE' : 'UPDATE',
        { req, session },
      );
      context.clearOriginal(doc._id.toString(), session);
    } catch (error) {
      reportError(error, 'post-hook save', { docId: doc._id, model: model.modelName });
      // Re-throw in transaction context
      if (extractSession(doc)) {
        throw error;
      }
    }
  });

  // findOneAndUpdate hook
  model.schema.post('findOneAndUpdate', async function (result: AuditableDocument | null) {
    try {
      if (!result) {
        return;
      }

      const session = extractSession(this);
      const oldDoc = context.getOriginal(result._id.toString(), session);
      await logChange(result, oldDoc || null, 'UPDATE', { req, session });
      context.clearOriginal(result._id.toString(), session);
    } catch (error) {
      reportError(error, 'post-hook findOneAndUpdate', {
        docId: result?._id,
        model: model.modelName,
      });
      // Re-throw in transaction context
      if (extractSession(this)) {
        throw error;
      }
    }
  });
};

const setupDeleteHooks = (model: Model<AuditableDocument>, req?: Request): void => {
  const context = ChangeTrackingContext.getInstance();

  model.schema.pre(['findOneAndDelete', 'deleteOne'], async function () {
    try {
      const session = extractSession(this);
      const findOptions: any = {};
      if (session) {
        findOptions.session = session;
      }

      const doc = await model.findOne(this.getQuery(), null, findOptions).lean();
      if (doc) {
        context.storeOriginal((doc as any)._id.toString(), doc as AuditableDocument, session);
      }
    } catch (error) {
      reportError(error, 'pre-hook delete', { model: model.modelName });
    }
  });

  model.schema.post(['findOneAndDelete', 'deleteOne'], async function (result: AuditableDocument | null) {
    try {
      if (!result) {
        return;
      }

      const session = extractSession(this);
      const oldDoc = context.getOriginal(result._id.toString(), session);
      const operation = oldDoc?.audit?.isDeleted ? 'SOFT_DELETE' : 'DELETE';
      await logChange(result, oldDoc || null, operation, { req, session });
      context.clearOriginal(result._id.toString(), session);
    } catch (error) {
      reportError(error, 'post-hook delete', {
        docId: result?._id,
        model: model.modelName,
      });
      // Re-throw in transaction context
      if (extractSession(this)) {
        throw error;
      }
    }
  });
};

/**
 * Main export - creates change tracking middleware for a model
 * @param req - Express request object for context
 * @returns Function that applies change tracking to a model
 */
export const trackChanges =
  (req?: Request) =>
  (model: Model<AuditableDocument>): void => {
    if (!isModelTracked(model.modelName)) {
      return;
    }

    setupPreHooks(model);
    setupPostHooks(model, req);
    setupDeleteHooks(model, req);

    // Additional hook for soft deletes with transaction support
    model.schema.post('save', async (doc: AuditableDocument) => {
      try {
        if (doc.audit?.isDeleted) {
          const session = extractSession(doc);
          const context = ChangeTrackingContext.getInstance();
          const oldDoc = context.getOriginal(doc._id.toString(), session) || null;
          await logChange(doc, oldDoc, 'SOFT_DELETE', { req, session });
          context.clearOriginal(doc._id.toString(), session);
        }
      } catch (error) {
        reportError(error, 'post-hook soft delete', {
          docId: doc._id,
          model: model.modelName,
        });
        // Re-throw in transaction context
        if (extractSession(doc)) {
          throw error;
        }
      }
    });
  };

/**
 * Utility export for manual change logging with transaction support
 * @param doc - The document being changed
 * @param operation - Type of operation performed
 * @param oldDoc - Previous version of the document (optional)
 * @param options - Request and session context
 */
export const manualChangeLog = async (
  doc: AuditableDocument,
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE',
  oldDoc?: AuditableDocument | null,
  options?: LogChangeOptions,
): Promise<void> => {
  await logChange(doc, oldDoc || null, operation, options);
};

/**
 * Utility function to apply change tracking to a model
 * @param model - Mongoose model to track
 * @param req - Express request object (optional)
 */
export const applyChangeTracking = (model: Model<any>, req?: Request): void => {
  trackChanges(req)(model as Model<AuditableDocument>);
};

/**
 * Transaction helper utility that provides automatic audit trail support
 * @param operation - Function containing the transaction operations
 * @param req - Express request object for context
 * @returns Promise resolving to the operation result
 *
 * @example
 * ```typescript
 * const result = await withTransactionAudit(async (session) => {
 *   const lead = new Lead({ name: 'John Doe' });
 *   await lead.save({ session });
 *
 *   await Lead.findByIdAndUpdate(
 *     lead._id,
 *     { status: 'contacted' },
 *     { session, new: true }
 *   );
 *
 *   return lead;
 * }, req);
 * ```
 */
export const withTransactionAudit = async <T>(
  operation: (session: ClientSession) => Promise<T>,
  req?: Request,
): Promise<T> => {
  // Use dynamic import to avoid require()
  const mongoose = await import('mongoose');
  const session = await mongoose.default.startSession();

  try {
    return await session.withTransaction(async () => {
      // Store request context for this session if needed
      if (req) {
        // Attach request to session for middleware access
        (session as any).requestContext = req;
      }
      return await operation(session);
    });
  } finally {
    await session.endSession();
  }
};
