import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import rbacRoutes from './routes/rbac.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Core Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Core Platform Routes
app.use('/api/core/auth', authRoutes);
app.use('/api/core/employees', employeeRoutes);
app.use('/api/core/rbac', rbacRoutes);

// Standard 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: {
      code: 'RESOURCE_NOT_FOUND',
      message: 'The requested resource or endpoint was not found.',
      details: [],
    },
  });
});

// Standard Global Error Handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    data: null,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected internal server error occurred.',
      details: process.env.NODE_ENV !== 'production' ? [err.stack] : [],
    },
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

export default app;
