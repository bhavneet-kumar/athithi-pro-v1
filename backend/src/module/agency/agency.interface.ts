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
