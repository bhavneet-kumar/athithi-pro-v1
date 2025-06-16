import { Schema, model, Document, Types } from 'mongoose';

export type RoleType = 'super_admin' | 'manager' | 'agent';

export interface IRole extends Document {
  name: string;
  type: RoleType;
  agency: Types.ObjectId;
  description: string;
  permissions: string[];
  isActive: boolean;
}

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['super_admin', 'manager', 'agent'],
    },
    agency: {
      type: Schema.Types.ObjectId,
      ref: 'Agency',
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    permissions: [
      {
        type: String,
        ref: 'Permission',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to ensure unique role type per agency
roleSchema.index({ agency: 1, type: 1 }, { unique: true });

export const Role = model<IRole>('Role', roleSchema);
