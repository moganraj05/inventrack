import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import supplierRoutes from './routes/supplierRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;
const BODY_LIMIT = '5mb';

connectDB();
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

app.use('/api/suppliers', supplierRoutes);
app.get('/health', (req, res) => res.json({ status: 'OK', service: 'Supplier Service' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Supplier service error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`✅ Supplier Service running on http://localhost:${PORT}`);
});

export default app;
