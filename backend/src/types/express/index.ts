import 'express';
import type CustomSuccess from '../../shared/utils/customSuccess';

declare module 'express-serve-static-core' {
  interface Response {
    customSuccess: (customSuccess: CustomSuccess) => this;
  }
}
