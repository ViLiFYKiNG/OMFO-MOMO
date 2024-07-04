import { TenantService } from '../services/TenantService';
import { NextFunction, Response } from 'express';
import { CreateTenantRequest } from '../types';
import { Logger } from 'winston';

export class TenantController {
  constructor(
    private tenantService: TenantService,
    private logger: Logger,
  ) {}

  async create(req: CreateTenantRequest, res: Response, next: NextFunction) {
    const { name, address } = req.body;

    this.logger.debug('Request for creating a tenant', { name, address });

    try {
      const tenant = await this.tenantService.create({ name, address });

      this.logger.info('Tenant has been registered:', tenant);

      res.send(201).json({ id: tenant.id });
    } catch (err) {
      next(err);
    }
  }
}
