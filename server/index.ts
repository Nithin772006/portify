import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import portfolioRoutes from './routes/portfolio';
import aiRoutes from './routes/ai';
import analyticsRoutes from './routes/analytics';
import skillsRoutes from './routes/skills';

// Schema route import
import professionSchemas from './config/schemas/professions.json';

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Static portfolio files
app.use('/p', express.static(path.join(__dirname, 'portfolios')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/skills', skillsRoutes);

// Schema route
app.get('/api/schema/:profession', (req, res) => {
  const profession = req.params.profession.toLowerCase().replace(/\s+/g, '-');
  const schema = (professionSchemas as any)[profession];
  if (!schema) {
    res.status(404).json({ error: 'Profession schema not found' });
    return;
  }
  res.json(schema);
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
async function start() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/portify';
    await mongoose.connect(mongoUri);
    console.log('✓ MongoDB connected');
  } catch (err) {
    console.error('✗ MongoDB connection failed:', err);
    console.log('  Server will start without database. Some features may not work.');
  }

  app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`  Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  });
}

start();
