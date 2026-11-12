const { doubleCsrf } = require('csrf-csrf');
const env = require('../config/env');

const {
  invalidCsrfTokenError,
  generateToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => env.csrfSecret,
  getSessionIdentifier: (req) =>
    req.session && req.session.userId ? `u:${req.session.userId}` : 'guest',
  cookieName: env.isProd ? '__Host-whereisit.x-csrf-token' : 'whereisit.x-csrf-token',
  cookieOptions: {
    sameSite: env.isProd ? 'none' : 'lax',
    path: '/',
    secure: env.isProd,
    httpOnly: true,
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => req.headers['x-csrf-token'],
});

module.exports = {
  invalidCsrfTokenError,
  generateToken,
  doubleCsrfProtection,
};
