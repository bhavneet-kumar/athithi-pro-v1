import 'express';
import type { IRole } from '../../shared/models/role.model'; // Make sure path is correct
import type CustomSuccess from '../../shared/utils/customSuccess';

declare module 'express-serve-static-core' {
  interface Response {
    customSuccess: (customSuccess: CustomSuccess) => this;
  }

  interface Request {
    user?: {
      id: string;
      agency: string;
      agencyCode: string;
      role: IRole;
    };
  }
}
