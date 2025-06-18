import { Request, Response, NextFunction } from 'express';

import { BadRequestError, CustomError, NotFoundError } from '../../shared/utils/customError';
import { CreatedSuccess, NoContentSuccess } from '../../shared/utils/customSuccess';

import { AgencyFilters, AgencyQueryParams, AgencySortOptions } from './agency.interface';
import { agencyService } from './agency.service';

/**
 * Represents the controller for agency-related operations.
 * Handles error management and response formatting.
 * Utilizes validation middleware for data validation.
 */
export class AgencyController {
  /**
   * Creates a new agency.
   * Validation is handled by middleware.
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns {Promise<void>}
   */
  async createAgency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const agency = await agencyService.createAgency(req.body);

      res.customSuccess(
        new CreatedSuccess(
          {
            id: agency.id,
            name: agency.name,
            code: agency.code,
            domain: agency.domain,
            isActive: agency.isActive,
            settings: agency.settings,
          },
          'Agency created successfully',
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves an agency by its ID.
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns {Promise<void>}
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
   * Updates an existing agency.
   * Validation is handled by middleware.
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns {Promise<void>}
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
   * Deletes an agency.
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns {Promise<void>}
   */
  async deleteAgency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { agencyId } = req.params;

      if (!agencyId) {
        throw new BadRequestError('Agency ID is required');
      }

      await agencyService.deleteAgency(agencyId);
      res.customSuccess(new NoContentSuccess('Agency deleted successfully'));
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      next(error);
    }
  }

  /**
   * Lists agencies with pagination and filtering.
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns {Promise<void>}
   */
  async listAgencies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, isActive, sort, order } = req.query as AgencyQueryParams;

      // Build filters for querying agencies
      const filters: AgencyFilters = {};
      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { domain: { $regex: search, $options: 'i' } },
        ];
      }
      if (typeof isActive !== 'undefined') {
        filters.isActive = isActive;
      }

      // Build sort options for querying agencies
      const sortObj: AgencySortOptions = {};
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
   * Retrieves an agency by its code.
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns {Promise<void>}
   */
  async getAgencyByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.params;

      if (!code) {
        throw new BadRequestError('Agency code is required');
      }

      const agency = await agencyService.getAgencyByCode(code);

      if (!agency) {
        throw new NotFoundError('Agency not found');
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
   * Updates the settings of an agency.
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   * @returns {Promise<void>}
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

/**
 * Instance of AgencyController for use in routes.
 */
export const agencyController = new AgencyController();
