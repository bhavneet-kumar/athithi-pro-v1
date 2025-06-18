import { Request, Response, NextFunction } from 'express';

import { BadRequestError } from '../../shared/utils/CustomError';
import { agencyService } from '../services/agency.service';

import { BaseController } from './base.controller';

/**
 * Agency Controller Class
 * Implements controller layer with proper error handling and response formatting
 * Follows OOP principles and uses validation middleware for data validation
 */
export class AgencyController extends BaseController<any> {
  constructor() {
    super(agencyService);
  }

  /**
   * List agencies with pagination and filtering
   * @param req
   * @param res
   * @param next
   */
  async listAgencies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, isActive, sort, order } = req.query as any;

      // Build filters
      const filters: any = {};
      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { domain: { $regex: search, $options: 'i' } },
        ];
      }
      if (isActive !== undefined) {
        filters.isActive = isActive;
      }

      // Build sort
      const sortObj: any = {};
      sortObj[sort || 'createdAt'] = order === 'asc' ? 1 : -1;

      const result = await agencyService.listAgencies(
        filters,
        Number.parseInt(page || '1', 10),
        Number.parseInt(limit || '10', 10),
        sortObj,
      );

      res.json({
        success: true,
        data: result.agencies.map((agency) => ({
          id: agency.id,
          name: agency.name,
          code: agency.code,
          domain: agency.domain,
          isActive: agency.isActive,
        })),
        pagination: {
          totalAgencies: result.totalAgencies,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get agency by code
   * @param req
   * @param res
   * @param next
   */
  async getAgencyByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.params;

      if (!code) {
        throw new BadRequestError('Agency code is required');
      }

      const agency = await agencyService.getAgencyByCode(code);

      if (!agency) {
        res.status(404).json({
          success: false,
          message: 'Agency not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: agency.id,
          name: agency.name,
          code: agency.code,
          domain: agency.domain,
          isActive: agency.isActive,
          settings: agency.settings,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update agency settings
   * @param req
   * @param res
   * @param next
   */
  async updateAgencySettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { agencyId } = req.params;

      if (!agencyId) {
        throw new BadRequestError('Agency ID is required');
      }

      const agency = await agencyService.updateAgencySettings(agencyId, req.body.settings);
      res.json({
        success: true,
        message: 'Agency settings updated successfully',
        data: {
          id: agency.id,
          settings: agency.settings,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const agencyController = new AgencyController();
