import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import procurementRoutes from './routes/procurementRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;
const BODY_LIMIT = '2mb';

connectDB();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

app.use('/api/procurement', procurementRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Procurement Service' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Procurement service error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`Procurement Service running on http://localhost:${PORT}`);
});

export default app;
