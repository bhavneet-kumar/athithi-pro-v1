import 'express';
import { UserRole } from 'types/enum/user';

import type CustomSuccess from '../../shared/utils/CustomSuccess';

declare module 'express-serve-static-core' {
  interface Response {
    customSuccess: (customSuccess: CustomSuccess) => this;
  }

  interface Request {
    user?: {
      id: string;
      agency: string;
      agencyCode: string;
      role: {
        type: UserRole;
      };
    };
  }
}
