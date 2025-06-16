import { Request, Response, NextFunction } from 'express';

import { BadRequestError, CustomError } from '../../shared/utils/CustomError';

import { agencyService } from './agency.service';

/**
 * Agency Controller Class
 * Implements controller layer with proper error handling and response formatting
 * Follows OOP principles and uses validation middleware for data validation
 */
export class AgencyController {
  /**
   * Create a new agency
   * Validation is handled by middleware
   */
  async createAgency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const agency = await agencyService.createAgency(req.body);
      res.status(201).json({
        success: true,
        message: 'Agency created successfully',
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
   * Get agency by ID
   */
  async getAgency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { agencyId } = req.params;

      if (!agencyId) {
        throw new BadRequestError('Agency ID is required');
      }

      const agency = await agencyService.getAgencyById(agencyId);
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
   * Update agency
   * Validation is handled by middleware
   */
  async updateAgency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { agencyId } = req.params;

      if (!agencyId) {
        throw new BadRequestError('Agency ID is required');
      }

      const agency = await agencyService.updateAgency(agencyId, req.body);
      res.json({
        success: true,
        message: 'Agency updated successfully',
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
   * Delete agency
   */
  async deleteAgency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { agencyId } = req.params;

      if (!agencyId) {
        throw new BadRequestError('Agency ID is required');
      }

      await agencyService.deleteAgency(agencyId);
      res.status(204).json({
        success: true,
        message: 'Agency deleted successfully',
      });
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      next(error);
    }
  }

  /**
   * List agencies with pagination and filtering
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
        parseInt(page || '1', 10),
        parseInt(limit || '10', 10),
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
