import { Request, Response, NextFunction } from 'express';

import { agencyRoleService } from '../../module/agency/agencyRole.service';
import { UserRole } from '../../types/enum/user';
import { ForbiddenError } from '../utils/customError';

interface AuthenticatedUser {
  agency: string;
  role: {
    type: UserRole;
  };
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

    const { agency, role } = req.user;
    const permission = `${resource}:${action}`;

    const hasPermission = await agencyRoleService.hasPermission(agency, role.type, permission);

    if (!hasPermission) {
      throw new ForbiddenError(`User does not have ${action} permission for ${resource}`);
    }

    next();
  };
