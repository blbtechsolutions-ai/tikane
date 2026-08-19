import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import 'express-async-errors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { config } from './config';
import { swaggerSpec } from './config/swagger';
import { errorHandler, notFoundHandler } from './common/middleware/error.middleware';
import { logger } from './common/utils/logger';

// Route imports
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { plansRouter } from './modules/plans/plans.routes';
import { subscriptionsRouter } from './modules/subscriptions/subscriptions.routes';
import { paymentsRouter } from './modules/payments/payments.routes';
import { transactionsRouter } from './modules/transactions/transactions.routes';
import { withdrawalsRouter } from './modules/withdrawals/withdrawals.routes';
import { agentsRouter } from './modules/agents/agents.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { penaltiesRouter } from './modules/penalties/penalties.routes';

export function createApp(): Application {
  const app = express();

  // ── Security middlewares ──────────────────────────────────────
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.use(cors({
    origin: (origin, callback) => {
      const allowed = [
        ...config.frontendUrls,
        'https://tikane.blbtech.net',
        'http://localhost:4200',
        'http://localhost:3000',
      ];
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  // ── Body parsing ─────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(compression());

  // ── Request logging ──────────────────────────────────────────
  app.use(morgan(config.isDev ? 'dev' : 'combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));

  // ── Global rate limiting ─────────────────────────────────────
  app.use(rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Trop de requêtes - veuillez réessayer plus tard',
    },
  }));

  // ── Health check ─────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      environment: config.env,
    });
  });

  // ── API Documentation ────────────────────────────────────────
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { background-color: #1a1a2e; }',
    customSiteTitle: 'Tikane API Docs',
  }));

  // ── API Routes ───────────────────────────────────────────────
  const api = config.apiPrefix;

  app.use(`${api}/auth`, authRouter);
  app.use(`${api}/users`, usersRouter);
  app.use(`${api}/plans`, plansRouter);
  app.use(`${api}/subscriptions`, subscriptionsRouter);
  app.use(`${api}/payments`, paymentsRouter);
  app.use(`${api}/transactions`, transactionsRouter);
  app.use(`${api}/withdrawals`, withdrawalsRouter);
  app.use(`${api}/agents`, agentsRouter);
  app.use(`${api}/admin`, adminRouter);
  app.use(`${api}/notifications`, notificationsRouter);
  app.use(`${api}/penalties`, penaltiesRouter);

  // ── Error handling ───────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
