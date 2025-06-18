import { NextFunction, Request, Response } from 'express';

// ==================== TYPES ====================
export interface AuditBaseFields {
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
  updatedBy: string | null;
  version: number;
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

type UserType = { id?: string } | undefined;

// ==================== HELPER FUNCTIONS ====================
const getCreationFields = (now: Date, user: UserType): Partial<AuditBaseFields> => ({
  createdAt: now,
  createdBy: user?.id ?? null,
  updatedAt: now,
  updatedBy: user?.id ?? null,
  version: 1,
  isDeleted: false,
});

const getUpdateFields = (now: Date, user: UserType): Partial<AuditBaseFields> => ({
  updatedAt: now,
  updatedBy: user?.id ?? null,
});

const getDeleteFields = (now: Date, user: UserType): Partial<AuditBaseFields> => ({
  updatedAt: now,
  updatedBy: user?.id ?? null,
  isDeleted: true,
  deletedAt: now,
  deletedBy: user?.id ?? null,
});

// ==================== MIDDLEWARE ====================
export const auditMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  const now = new Date();
  const user = req.user as UserType;

  // Handle POST requests (creation)
  if (req.method === 'POST') {
    req.body.audit = getCreationFields(now, user);
    return next();
  }

  // Handle PUT/PATCH/DELETE requests (updates)
  const auditFields = req.method === 'DELETE' ? getDeleteFields(now, user) : getUpdateFields(now, user);

  // Add audit fields directly to the body
  req.body = {
    ...req.body,
    ...auditFields,
  };

  next();
};
