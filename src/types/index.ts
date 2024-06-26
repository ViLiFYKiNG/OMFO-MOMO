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
