import express, { NextFunction, Request, Response } from 'express';
import { AuthController } from '../controllers/AuthControllers';
import { UserService } from '../services/UserService';
import { User } from '../entity/User';
import { AppDataSource } from '../config/data-source';
import logger from '../config/logger';
import registerValidator from '../validators/register-validator';

const router = express.Router();
const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository, logger);
const authController = new AuthController(userService, logger);

router.post(
  '/register',
  registerValidator,
  (req: Request, res: Response, next: NextFunction) =>
    authController.register(req, res, next),
);

export default router;
