import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';

import { PAGINATION_DEFAULT_LIMIT, PAGINATION_DEFAULT_PAGE } from '../../shared/constant/validation';
import { CreatedSuccess, NoContentSuccess, OkSuccess } from '../../shared/utils/CustomSuccess';

import { ILeadFilter } from './lead.interface';
import { leadService } from './lead.service';

/**
 * Authentication Controller Class
 * Implements controller layer with proper error handling and response formatting
 */
export class LeadController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lead = await leadService.createLead(
        { ...req.body, agencyId: req.user.agency as string },
        req.user.agencyCode as string,
      );
      res.customSuccess(new CreatedSuccess(lead, 'Lead created successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: ILeadFilter = {
        ...req.query,
        agencyId: new Types.ObjectId(req.user.agency as string),
        limit: req.query.limit ? Number.parseInt(req.query.limit as string) : PAGINATION_DEFAULT_LIMIT,
        page: req.query.page ? Number.parseInt(req.query.page as string) : PAGINATION_DEFAULT_PAGE,
      };
      const leads = await leadService.getAll(query, req.user.agency as string);
      res.customSuccess(new OkSuccess(leads, 'Leads fetched successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lead = await leadService.getById(req.params.id, req.user.agency as string);
      res.customSuccess(new OkSuccess(lead, 'Lead fetched successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lead = await leadService.update(req.params.id, req.body, req.user.agency as string);
      res.customSuccess(new OkSuccess(lead, 'Lead updated successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await leadService.delete(req.params.id, req.user.agency as string, req.body);
      res.customSuccess(new NoContentSuccess('Lead deleted successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async changeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lead = await leadService.changeStatus(req.params.id, req.body, req.body.status, req.user.agency as string);
      res.customSuccess(new OkSuccess(lead, 'Lead status changed successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async exportLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filePath = await leadService.exportLeads(req.user.agency as string, req.query);
      res.download(filePath);
    } catch (error) {
      next(error);
    }
  }
}

export const leadController = new LeadController();
