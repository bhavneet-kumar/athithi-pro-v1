import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';

export interface AuditFields {
  // For creation (POST)
  createdAt?: Date;
  createdBy?: Types.ObjectId | null;
  updatedAt?: Date;
  updatedBy?: Types.ObjectId | null;
  version?: number;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;

  // For updates (PUT/PATCH/DELETE)
  $set?: {
    updatedAt?: Date;
    updatedBy?: Types.ObjectId | null;
    isDeleted?: boolean;
    deletedAt?: Date | null;
    deletedBy?: Types.ObjectId | null;
  };
  $inc?: {
    version?: number;
  };
}

type UserType = { id?: string } | undefined;

const getCreationFields = (now: Date, user: UserType): AuditFields => ({
  createdAt: now,
  createdBy: user?.id ? new Types.ObjectId(user.id) : null,
  updatedAt: now,
  updatedBy: user?.id ? new Types.ObjectId(user.id) : null,
  version: 1,
  isDeleted: false,
});

const getUpdateFields = (now: Date, user: UserType): AuditFields => ({
  $set: {
    updatedAt: now,
    updatedBy: user?.id ? new Types.ObjectId(user.id) : null,
  },
  $inc: { version: 1 },
});

const getDeleteFields = (now: Date, user: UserType): AuditFields => ({
  $set: {
    updatedAt: now,
    updatedBy: user?.id ? new Types.ObjectId(user.id) : null,
    isDeleted: true,
    deletedAt: now,
    deletedBy: user?.id ? new Types.ObjectId(user.id) : null,
  },
  $inc: { version: 1 },
});

export const auditMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  const now = new Date();
  const user = req.user as UserType;

  switch (req.method) {
    case 'POST': {
      req.auditFields = getCreationFields(now, user);
      break;
    }
    case 'PUT':
    case 'PATCH': {
      req.auditFields = getUpdateFields(now, user);
      break;
    }
    case 'DELETE': {
      req.auditFields = getDeleteFields(now, user);
      break;
    }
    default: {
      req.auditFields = {};
      break;
    }
  }

  next();
};

declare module 'express-serve-static-core' {
  interface Request {
    auditFields?: AuditFields;
  }
}
