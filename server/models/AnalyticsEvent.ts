import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsEvent extends Document {
  portfolioId: string;
  type: 'pageview' | 'section-view';
  source: string;
  device: string;
  sessionId: string;
  section?: string;
  timeSpentMs?: number;
  timestamp: Date;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>({
  portfolioId: { type: String, required: true, index: true },
  type: { type: String, enum: ['pageview', 'section-view'], required: true },
  source: { type: String, default: 'direct' },
  device: { type: String, default: 'unknown' },
  sessionId: { type: String, required: true },
  section: { type: String },
  timeSpentMs: { type: Number },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);
