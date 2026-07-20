import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from '../routes/authRoutes.js';
import userRoutes from '../routes/userRoutes.js';
import courseRoutes from '../routes/courseRoutes.js';
import statsRoutes from '../routes/statsRoutes.js';
import leaveRoutes from '../routes/leaveRoutes.js';
import noticeRoutes from '../routes/noticeRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: isProduction ? true : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '50mb' }));

// Serverless MongoDB connection middleware
const connectDB = async () => {
  if (mongoose.connections[0].readyState) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.log("MongoDB connection error:", err.message);
    throw err;
  }
};

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: "Database connection failed", error: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/notices', noticeRoutes);

app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

export default app;
