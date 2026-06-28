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
import { skillsRouter } from './skills/skills.router.js';
import { projectsRouter } from './projects/projects.router.js';
import { participationsRouter } from './participations/participations.router.js';
import { cvRouter } from './cv/cv.router.js';
import { templatesRouter } from './templates/templates.router.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(): express.Express {
  const app = express();
  app.use(logger);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cors({ origin: config.frontendUrl, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(
    '/uploads',
    (_req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      next();
    },
    express.static(path.join(__dirname, '..', 'uploads')),
  );

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/auth', authRouter);
  app.use('/api/staff', staffRouter);
  app.use('/api/staff/:staffId/skills', skillsRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/projects/:projectId/participations', participationsRouter);
  app.use('/api/cv', cvRouter);
  app.use('/api/templates', templatesRouter);

  app.use(errorHandler);
  return app;
}
