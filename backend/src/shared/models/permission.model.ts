import { Schema, model, Document } from 'mongoose';

export interface IPermission extends Document {
  name: string;
  resource: string;
  action: string;
  isActive: boolean;
}

const permissionSchema = new Schema<IPermission>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    resource: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['create', 'read', 'update', 'delete', 'manage'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Permission = model<IPermission>('Permission', permissionSchema);
