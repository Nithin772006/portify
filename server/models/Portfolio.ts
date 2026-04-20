import mongoose, { Schema, Document } from 'mongoose';

export interface IPortfolio extends Document {
  userId: mongoose.Types.ObjectId;
  portfolioId: string;
  profession: string;
  themeId: string;
  formData: Record<string, any>;
  generatedContent?: Record<string, any>;
  generatedHTML?: string;
  score: number;
  breakdown: {
    completeness: number;
    skillScore: number;
    projectScore: number;
    atsScore: number;
    bioScore: number;
  };
  suggestions: Array<{ text: string; pts: number; priority: string }>;
  htmlPath?: string;
  versions: Array<{ id: string; htmlPath: string; createdAt: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioSchema = new Schema<IPortfolio>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  portfolioId: { type: String, required: true, unique: true },
  profession: { type: String, required: true },
  themeId: { type: String, default: 'quantum-canvas' },
  formData: { type: Schema.Types.Mixed, required: true },
  generatedContent: { type: Schema.Types.Mixed, default: null },
  generatedHTML: { type: String, default: '' },
  score: { type: Number, default: 0 },
  breakdown: {
    completeness: { type: Number, default: 0 },
    skillScore: { type: Number, default: 0 },
    projectScore: { type: Number, default: 0 },
    atsScore: { type: Number, default: 0 },
    bioScore: { type: Number, default: 0 },
  },
  suggestions: [{ text: String, pts: Number, priority: String }],
  htmlPath: { type: String, default: '' },
  versions: [{ id: String, htmlPath: String, createdAt: { type: Date, default: Date.now } }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

PortfolioSchema.pre('save', function () {
  this.updatedAt = new Date();
});

export default mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);
