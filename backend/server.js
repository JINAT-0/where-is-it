const env = require('./src/config/env');
const { testConnection } = require('./src/config/db');
const app = require('./src/app');

async function startServer() {
  try {
    await testConnection();
    console.log(`[DB] Connected to MySQL database "${env.db.name}" at ${env.db.host}:${env.db.port}`);

    app.listen(env.port, () => {
      console.log(`[API] Where Is It? backend running at http://localhost:${env.port}`);
      console.log(`[API] Environment: ${env.nodeEnv}`);
    });
  } catch (err) {
    console.error('[Startup Failed] Could not connect to MySQL:', err.message);
    process.exit(1);
  }
}

startServer();

