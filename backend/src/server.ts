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

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`🚀 HealthCare Backend API running on port ${config.port} (${config.nodeEnv} mode)`);
  console.log(`🌐 Base URL: http://localhost:${config.port}/api`);

  startBackgroundScheduler();
});

export default app;
