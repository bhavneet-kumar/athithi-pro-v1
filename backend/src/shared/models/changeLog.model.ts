import { Schema, model, Document, Types } from 'mongoose';

interface IChangeLog extends Document {
  entityId: Types.ObjectId;
  entityType: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  changes: {
    field: string; // Dot notation path (e.g., 'status', 'audit.updatedBy')
    oldValue: unknown;
    newValue: unknown;
  }[];
  changedBy: Types.ObjectId;
  changedAt: Date;
  metadata?: {
    // Flexible key-value store
    ip?: string;
    userAgent?: string;
    location?: {
      city?: string;
      country?: string;
    };
    device?: 'mobile' | 'desktop' | 'tablet';
    [key: string]: unknown; // Allow custom fields
  };
}

const ChangeLogSchema = new Schema<IChangeLog>(
  {
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    operation: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE'], required: true },
    changes: [
      {
        field: { type: String, required: true },
        oldValue: { type: Schema.Types.Mixed },
        newValue: { type: Schema.Types.Mixed },
      },
    ],
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed }, // Flexible meta storage
  },
  { timestamps: true },
);

export const ChangeLog = model<IChangeLog>('ChangeLog', ChangeLogSchema);
