import { Request, Response } from 'express';

import { leadsService } from '../services/leads.service';

import { BaseController } from './base.controller';

/**
 * Leads Controller Class Following Abstract Factory Pattern
 * Extends BaseController to inherit common CRUD operations
 */
export class LeadsController extends BaseController<any> {
  constructor() {
    super(leadsService);
  }
}

export const leadsController = new LeadsController();
