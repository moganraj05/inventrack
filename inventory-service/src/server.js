import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import transferRoutes from './routes/transferRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const BODY_LIMIT = '5mb';

connectDB();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

app.use('/api/inventory', inventoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/inventory/transfer', transferRoutes);

app.get('/health', (req, res) => res.json({ status: 'OK', service: 'Inventory Service' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Inventory service error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`✅ Inventory Service running on http://localhost:${PORT}`);
});

export default app;
