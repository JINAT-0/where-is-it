const path = require('path');
const dotenv = require('dotenv');

// Load .env from backend/.env if present, fallback to root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const isProd = process.env.NODE_ENV === 'production';

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd,
  port: parseInt(process.env.PORT, 10) || 5000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'where_is_it_db',
    ssl: process.env.DB_SSL === 'true',
  },
  sessionSecret:
    process.env.SESSION_SECRET ||
    'dev_only_where_is_it_session_secret_change_in_production_64chars',
  csrfSecret:
    process.env.CSRF_SECRET ||
    'dev_only_where_is_it_csrf_secret_change_in_production_64chars',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000/api/v1',
  uploadMaxSizeBytes: 5 * 1024 * 1024, // 5 MB
};

module.exports = env;

