import { Document } from 'mongoose';

export interface IAgencySettings {
  maxUsers: number;
  allowedDomains: string[];
  customBranding?: {
    logo?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
  };
}

export interface IAgency extends Document {
  name: string;
  code: string;
  domain: string;
  settings: IAgencySettings;
  isActive: boolean;
}

export interface ICreateAgencyDTO {
  name: string;
  code: string;
  domain: string;
  settings?: IAgencySettings;
}

export interface IUpdateAgencyDTO {
  name?: string;
  code?: string;
  domain?: string;
  settings?: IAgencySettings;
  isActive?: boolean;
}

export interface AgencyQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  isActive?: string;
  sort?: string;
  order?: string;
}

export interface AgencyFilters {
  $or?: Array<Record<string, { $regex: string; $options: string }>>;
  isActive?: string;
}

export interface AgencySortOptions {
  [key: string]: 1 | -1;
}
