import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import statsRoutes from './routes/statsRoutes.js';  

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// mongodb connection
import mongoose from 'mongoose';
mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error: '+err.message));


app.use('/api/auth',authRoutes);
app.use('/api/users',userRoutes);
app.use('/api/courses',courseRoutes )
app.use('/api/stats',statsRoutes )


app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});