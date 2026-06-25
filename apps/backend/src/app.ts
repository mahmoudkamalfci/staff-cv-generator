import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';
import { authRouter } from './auth/auth.router.js';
import { staffRouter } from './staff/staff.router.js';
import { projectsRouter } from './projects/projects.router.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(): express.Express {
  const app = express();
  app.use(logger);
  app.use(helmet());
  app.use(cors({ origin: config.frontendUrl, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/auth', authRouter);
  app.use('/api/staff', staffRouter);
  app.use('/api/projects', projectsRouter);

  app.use(errorHandler);
  return app;
}
