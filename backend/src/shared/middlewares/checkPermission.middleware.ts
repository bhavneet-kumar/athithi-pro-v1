import { Request, Response, NextFunction } from 'express';

import { agencyRoleService } from '../../module/agency/agencyRole.service';
import { IRole } from '../models/role.model';
import { ForbiddenError } from '../utils/customError';

import { auditMiddleware } from './audit.middleware';

interface AuthenticatedUser {
  id: string;
  agency: string;
  agencyCode: string;
  role: any;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const checkPermission =
  (resource: string, action: string) =>
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        throw new ForbiddenError('User not authenticated');
      }

      const { role } = req.user;
      const permission = `${resource}:${action}`;

      console.log(role, permission, '+++++ROLE&&&&&&&&&&&&&');

      const hasPermission = await agencyRoleService.hasPermission(role, permission);

      if (!hasPermission) {
        next(new ForbiddenError(`User does not have ${action} permission for ${resource}`));
      }

      auditMiddleware(req, res, next);

      next();
    };
