import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const BODY_LIMIT = '5mb';

// Connect to database
connectDB();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', service: 'Auth Service' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Auth service error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`✅ Auth Service running on http://localhost:${PORT}`);
});

export default app;
