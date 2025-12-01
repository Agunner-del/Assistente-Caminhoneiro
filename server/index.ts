import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase, genAI } from './lib/clients.ts';
import authRoutes from './routes/auth.ts';
import transactionRoutes from './routes/transactions.ts';
import fuelRoutes from './routes/fuel.ts';
import inventoryRoutes from './routes/inventory.ts';
import aiRoutes from './routes/ai.ts';
import { 
  helmetMiddleware, 
  generalRateLimit, 
  authRateLimit, 
  aiRateLimit,
  validateContentType,
  sanitizeInput 
} from './middleware/security.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware - ORDEM É IMPORTANTE!
app.use(helmetMiddleware);
app.use(generalRateLimit);
app.use(validateContentType);
app.use(sanitizeInput);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://seu-dominio.com', 'https://app.seu-dominio.com']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Limitar tamanho do body
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Clients are initialized in lib/clients.ts

// Routes com rate limiting específico
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/fuel-logs', fuelRoutes);
app.use('/api/visual-inventory', inventoryRoutes);
app.use('/api/ai', aiRateLimit, aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
