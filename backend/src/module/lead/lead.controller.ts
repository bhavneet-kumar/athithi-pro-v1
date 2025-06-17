import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';

import { PAGINATION_DEFAULT_LIMIT, PAGINATION_DEFAULT_PAGE } from '../../shared/constant/validation';
import { CreatedSuccess, OkSuccess } from '../../shared/utils/CustomSuccess';

import { ILeadFilter } from './lead.interface';
import { leadService } from './lead.service';

/**
 * Authentication Controller Class
 * Implements controller layer with proper error handling and response formatting
 */
export class LeadController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lead = await leadService.createLead(req.body);
      const response = new CreatedSuccess(lead, 'Lead created successfully.');
      res.status(response.httpCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: ILeadFilter = {
        agencyId: new Types.ObjectId(req.query.agencyId as string),
        limit: req.query.limit ? Number.parseInt(req.query.limit as string) : PAGINATION_DEFAULT_LIMIT,
        page: req.query.page ? Number.parseInt(req.query.page as string) : PAGINATION_DEFAULT_PAGE,
      };
      const leads = await leadService.getAll(query);
      const response = new OkSuccess(leads, 'Leads fetched successfully.');
      res.status(response.httpCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lead = await leadService.getById(req.params.id, {
        agencyId: new Types.ObjectId(req.query.agencyId as string),
      });
      const response = new OkSuccess(lead, 'Lead fetched successfully.');
      res.status(response.httpCode).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const leadController = new LeadController();
