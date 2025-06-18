import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';

// Define the type for audit fields
export interface AuditFields {
  createdAt?: Date;
  createdBy?: Types.ObjectId | null;
  updatedAt?: Date;
  updatedBy?: Types.ObjectId | null;
  version?: number | { $inc: number };
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId | null;
  $inc?: { version: number };
  $set?: Record<string, unknown>;
}

type UserType = { _id?: string } | undefined;

const getAuditFieldsForPost = (now: Date, user: UserType): AuditFields => ({
  createdAt: now,
  createdBy: user?._id ? new Types.ObjectId(user._id) : null,
  updatedAt: now,
  updatedBy: user?._id ? new Types.ObjectId(user._id) : null,
  version: 1,
  isDeleted: false,
});

const getAuditFieldsForPutOrPatch = (now: Date, user: UserType): AuditFields => ({
  updatedAt: now,
  updatedBy: user?._id ? new Types.ObjectId(user._id) : null,
  $inc: { version: 1 },
});

const getAuditFieldsForDelete = (now: Date, user: UserType): AuditFields => ({
  updatedAt: now,
  updatedBy: user?._id ? new Types.ObjectId(user._id) : null,
  isDeleted: true,
  deletedAt: now,
  deletedBy: user?._id ? new Types.ObjectId(user._id) : null,
  $inc: { version: 1 },
});

export const auditMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const now = new Date();
  const user = req.user as UserType;

  switch (req.method) {
    case 'POST': {
      req.auditFields = getAuditFieldsForPost(now, user);
      break;
    }
    case 'PUT':
    case 'PATCH': {
      req.auditFields = getAuditFieldsForPutOrPatch(now, user);
      break;
    }
    case 'DELETE': {
      req.auditFields = getAuditFieldsForDelete(now, user);
      break;
    }
    default: {
      req.auditFields = getAuditFieldsForPost(now, user);
      break;
    }
  }

  next();
};

// Type augmentation for Express Request using module augmentation
declare module 'express-serve-static-core' {
  interface Request {
    auditFields?: AuditFields;
  }
}
