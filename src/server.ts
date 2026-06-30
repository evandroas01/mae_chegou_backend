import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/env';
import routes from './routes';

const app = express();

// Middlewares
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', routes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

const PORT = config.port;
const HOST = process.env.HOST || '0.0.0.0'; // Escuta em todos os IPs para permitir conexões da rede local

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
  console.log(`🌐 CORS enabled for: ${JSON.stringify(config.cors.origin)}`);
  console.log(`💡 Para conectar do celular, use: http://<SEU_IP_LOCAL>:${PORT}/api`);
});

