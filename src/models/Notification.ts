import { Schema, model, Document, Types } from 'mongoose';
import { INotification, NotificationType, NotificationStatus } from './types';

/**
 * NotificationDocument merges the plain INotification interface with
 * Mongoose's Document, giving us full type-safety across both layers.
 * We omit the synthetic 'id' string field because Mongoose manages _id.
 */
export interface NotificationDocument
  extends Omit<INotification, 'id' | 'createdAt'>,
    Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    recipient: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    subject: { type: String, trim: true },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'] as NotificationStatus[],
      default: 'pending',
    },
  },
  {
    // Automatically manages createdAt and updatedAt
    timestamps: true,
    // Always return a virtual 'id' string alongside _id
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index for efficient timestamp-descending queries
NotificationSchema.index({ createdAt: -1 });

export const NotificationModel = model<NotificationDocument>(
  'Notification',
  NotificationSchema,
);
