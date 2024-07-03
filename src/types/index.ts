import { Request } from 'express';

export interface UserData {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: string;
}

export interface RegisterUserRequest extends Request {
  body: UserData;
}

export interface AuthRequest extends Request {
  auth: {
    id?: string;
    sub: string;
    role: string;
  };
}

export interface AuthCookie {
  accessToken: string;
  refreshToken: string;
}

export interface IRefreshTokenPayload {
  id: string;
}
