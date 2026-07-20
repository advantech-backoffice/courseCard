import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--prod');

const corsOptions = {
  origin: isProduction ? true : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' }));

if (isProduction) {
  const frontendDist = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist));
}

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error: ' + err.message));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/notices', noticeRoutes);

app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from backend 🚀' });
});

if (isProduction) {
  app.get(/.*/, (req, res) => {
    const frontendDist = path.join(__dirname, '../frontend/dist');
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

export default app;
