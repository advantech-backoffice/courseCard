import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from '../routes/authRoutes.js';
import userRoutes from '../routes/userRoutes.js';
import courseRoutes from '../routes/courseRoutes.js';
import statsRoutes from '../routes/statsRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Prevent multiple DB connections in serverless
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("MongoDB connected");
  } catch (err) {
    console.log("MongoDB connection error:", err.message);
  }
};

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

export default app;