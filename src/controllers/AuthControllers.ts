import { NextFunction, Response } from 'express';
import { RegisterUserRequest } from '../types';
import { JwtPayload } from 'jsonwebtoken';

import { UserService } from '../services/UserService';
import { Logger } from 'winston';
import { validationResult } from 'express-validator';
import { ROLES } from '../constants';
import { TokenService } from '../services/TokenService';
import { User } from '../entity/User';
import createHttpError from 'http-errors';
import { CredentialService } from './CredentialService';

export class AuthController {
  constructor(
    private userService: UserService,
    private logger: Logger,
    private tokenService: TokenService,
    private credentialService: CredentialService,
  ) {}

  async register(req: RegisterUserRequest, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const { firstName, lastName, email, password } = req.body;
    this.logger.info('New request for registering user:', {
      firstName,
      lastName,
      email,
      password: '*********',
    });

    try {
      const user = await this.userService.create({
        firstName,
        lastName,
        email,
        password,
      });
      this.logger.info('User has been registered:', user);

      const payLoad: JwtPayload = {
        sub: user.id || 1,
        role: user.role || ROLES.CUSTOMER,
      };

      const accessToken = this.tokenService.generateAccessToken(payLoad);

      const newRefreshTokenId = await this.tokenService.persistRefreshToken(
        user as User,
      );

      const refreshToken = this.tokenService.generateRefreshToken({
        ...payLoad,
        id: newRefreshTokenId,
      });

      this.logger.info('THIS IS ACCESS TOKEN', { accessToken });
      this.logger.info('THIS IS REFRESH TOKEN', { refreshToken });

      res.cookie('accessToken', accessToken, {
        domain: 'localhost',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60,
        httpOnly: true,
      });

      res.cookie('refreshToken', refreshToken, {
        domain: 'localhost',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 365,
        httpOnly: true,
      });

      res.status(201).json(user);
    } catch (error) {
      next(error);
      return;
    }
  }

  async login(req: RegisterUserRequest, res: Response, next: NextFunction) {
    // Validation
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }
    const { email, password } = req.body;

    this.logger.debug('New request to login a user.', {
      email,
      password: '******',
    });

    try {
      const user = await this.userService.findByEmail(email);

      if (!user) {
        const error = createHttpError(400, 'Email or password does not match.');
        next(error);
        return;
      }

      const passwordMatch = await this.credentialService.comparePassword(
        password,
        user.password,
      );

      if (!passwordMatch) {
        const error = createHttpError(400, 'Email or password does not match.');
        next(error);
        return;
      }

      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      };

      const accessToken = this.tokenService.generateAccessToken(payload);

      const newRefreshToken = await this.tokenService.persistRefreshToken(user);

      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: String(newRefreshToken.id),
      });

      res.cookie('accessToken', accessToken, {
        domain: 'localhost',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 1,
        httpOnly: true,
      });

      res.cookie('refreshToken', refreshToken, {
        domain: 'localhost',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 365,
        httpOnly: true,
      });

      this.logger.info('User has been logged in..', { id: user.id });
      res.json({ id: user.id });
    } catch (err) {
      next(err);
      return;
    }
  }
}
