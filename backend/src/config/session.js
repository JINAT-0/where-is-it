const session = require('express-session');
const MySQLStoreFactory = require('express-mysql-session');
const { pool } = require('./db');
const env = require('./env');

const MySQLStore = MySQLStoreFactory(session);

const sessionStore = new MySQLStore(
  {
    expiration: 1000 * 60 * 60 * 24 * 7, // 7 days
    createDatabaseTable: true,
    schema: {
      tableName: 'sessions',
      columnNames: {
        session_id: 'session_id',
        expires: 'expires',
        data: 'data',
      },
    },
  },
  pool
);

const sessionMiddleware = session({
  name: 'where_is_it.sid',
  secret: env.sessionSecret,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    path: '/',
  },
});

module.exports = {
  sessionMiddleware,
  sessionStore,
};

