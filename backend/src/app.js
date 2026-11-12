const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const { sessionMiddleware } = require('./config/session');
const { doubleCsrfProtection, invalidCsrfTokenError } = require('./middleware/csrf');
const { apiLimiter } = require('./middleware/rateLimit');
const apiRoutes = require('./routes');
const { sendError } = require('./utils/apiResponse');

const app = express();

if (env.isProd) {
  app.set('trust proxy', 1);
}

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration supporting configured frontend URL
const allowedOrigins = env.frontendUrl
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-csrf-token'],
  })
);

// Body and cookie parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(env.csrfSecret));

// Persistent MySQL-backed sessions
app.use(sessionMiddleware);

// Serve ONLY public item images (private claim evidence is NEVER exposed statically)
app.use(
  '/uploads/items',
  express.static(path.resolve(__dirname, '../uploads/items'), {
    fallthrough: false,
    index: false,
  })
);

// Rate limiting & CSRF protection on API routes
app.use('/api/v1', apiLimiter);
app.use('/api/v1', doubleCsrfProtection);
app.use('/api/v1', apiRoutes);

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
  return sendError(res, {
    statusCode: 404,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err === invalidCsrfTokenError || err.code === 'EBADCSRFTOKEN') {
    return sendError(res, {
      statusCode: 403,
      message: 'Invalid or expired CSRF token. Please refresh and try again.',
    });
  }

  if (err.message === 'Origin not allowed by CORS') {
    return sendError(res, {
      statusCode: 403,
      message: 'CORS error: origin not permitted.',
    });
  }

  const statusCode = err.statusCode || 500;
  const message =
    statusCode >= 500 && env.isProd
      ? 'An unexpected server error occurred. Please try again later.'
      : err.message || 'Internal server error';

  if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
    console.error('[Server Error]', err);
  }

  return sendError(res, {
    statusCode,
    message,
    errors: err.errors || [],
  });
});

module.exports = app;

