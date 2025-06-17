import { Document } from 'mongoose';

export interface IAuthTokens {
  token: string;
  refreshToken: string;
}

export interface ILoginResponse extends IAuthTokens {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IRegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}


export interface IPasswordResetInput {
  password: string;
}

export interface IRefreshTokenInput {
  refreshToken: string;
}
// .