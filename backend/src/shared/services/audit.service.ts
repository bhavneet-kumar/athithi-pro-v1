import { Schema, model, Document } from 'mongoose';

interface IAuditLog extends Document {
  userId?: string;
  action: string;
  ip: string;
  userAgent: string;
  status: 'success' | 'failure';
  details: any;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: String,
      ref: 'User',
    },
    action: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['success', 'failure'],
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);

class AuditService {
  async logLoginAttempt(
    userId: string | undefined,
    ip: string,
    userAgent: string,
    status: 'success' | 'failure',
    details?: any,
  ): Promise<void> {
    await AuditLog.create({
      userId,
      action: 'login',
      ip,
      userAgent,
      status,
      details,
    });
  }

  async logPasswordReset(
    userId: string,
    ip: string,
    userAgent: string,
    status: 'success' | 'failure',
    details?: any,
  ): Promise<void> {
    await AuditLog.create({
      userId,
      action: 'password_reset',
      ip,
      userAgent,
      status,
      details,
    });
  }

  async logEmailVerification(
    userId: string,
    ip: string,
    userAgent: string,
    status: 'success' | 'failure',
    details?: any,
  ): Promise<void> {
    await AuditLog.create({
      userId,
      action: 'email_verification',
      ip,
      userAgent,
      status,
      details,
    });
  }
}

export const auditService = new AuditService();
