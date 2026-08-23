import cors from 'cors';
import express from 'express';
import { config } from './config/index';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import routes from './routes/index';
import { startBackgroundScheduler } from './services/scheduler.service';

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
  });
}

// Root welcome endpoint for health monitors and browsers
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'CuraPulse - Healthcare Appointment & Follow-up Platform API',
    status: 'online',
    version: '1.0.0',
    documentation: 'Access endpoints under /api',
    endpoints: {
      health: '/api/health',
      doctors: '/api/doctors',
      auth: '/api/auth',
      appointments: '/api/appointments',
      consultations: '/api/consultations',
      leaves: '/api/leaves',
      notifications: '/api/notifications',
      admin: '/api/admin',
    },
  });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`🚀 HealthCare Backend API running on port ${config.port} (${config.nodeEnv} mode)`);
  console.log(`🌐 Base URL: http://localhost:${config.port}/api`);

  startBackgroundScheduler();
});

export default app;
