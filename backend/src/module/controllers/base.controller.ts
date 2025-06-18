import { Request, Response, NextFunction } from 'express';

export class BaseController<T> {
  protected service: any;

  constructor(service: any) {
    this.service = service;
  }

  /**
   * Create a new entity
   * Validation is handled by middleware
   * @param req
   * @param res
   * @param next
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.create(req.body);

      res.status(201).json({ success: true, data: result, message: 'Created successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.getAll();

      res.json({ success: true, data: result, message: 'Record(s) fetched successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.getEntityById(req.params.id);
      if (!result) {
        res.status(404).json({ message: 'Not found' });
      }

      res.json({ success: true, data: result, message: 'Record fetched successfully' });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.updateEntity(req.params.id, req.body);
      if (!result) {
        res.status(404).json({ message: 'Not found' });
      }

      res.json({ success: true, data: result, message: 'Updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.service.deleteEntityById(req.params.id);
      if (!result) {
        res.status(404).json({ message: 'Not found' });
      }

      res.json({ success: true, data: result, message: 'Deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
