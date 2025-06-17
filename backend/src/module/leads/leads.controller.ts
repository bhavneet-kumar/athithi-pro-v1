import { Request, Response } from 'express';
import { leadsService } from './leads.service';

export class LeadsController {
  async createLead(req: Request, res: Response): Promise<void> {
    try {
      const lead = await leadsService.createLeads(req.body);
      res.status(201).json(lead);
    } catch (error) {
      res.status(500).json({ error });
    }
  };

  async getLeads (_req: Request, res: Response) : Promise<void> {
    try {
      const leads = await leadsService.find();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error });
    }
  };

  async getLeadById(req: Request, res: Response): Promise<void> {
    try {
      const { leadId } = req.params;
      const lead = await leadsService.getLeadById(leadId);
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error });
    }
  };

  async deleteLeadById(req: Request, res: Response): Promise<void> {
    try {
      const { leadId } = req.params;
      const lead = await leadsService.deleteLeadById(leadId);
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error });
    }
  };
}

export const leadsController = new LeadsController();