import 'express';
import type CustomSuccess from '../../shared/utils/CustomSuccess';

declare module 'express-serve-static-core' {
  interface Response {
    customSuccess: (customSuccess: CustomSuccess) => this;
  }
}
