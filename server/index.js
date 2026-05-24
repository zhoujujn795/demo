import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import stockRouter from './routes/stock.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../client/dist');
const rootEnvPath = path.resolve(__dirname, '../.env');

dotenv.config({ path: rootEnvPath });

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    service: 'ai-stock-dashboard-server',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', stockRouter);

// In production deployment, serve built frontend assets from client/dist.
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    next();
    return;
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.use((err, _req, res, _next) => {
  const status = Number(err.status || 500);
  const message = err.message || 'Internal server error';
  res.status(status).json({ success: false, error: message });
});

app.listen(port, () => {
  console.log(`Server is running on http://127.0.0.1:${port}`);
});
