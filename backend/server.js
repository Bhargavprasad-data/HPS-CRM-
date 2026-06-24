require('dotenv').config();
const app = require('./src/app');
const { testConnection } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║        HPS CRM Backend Server            ║');
  console.log('║     Harsha Perfect Solutions CRM         ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.warn('⚠️  Database connection failed. Ensure PostgreSQL is running and .env is configured.');
    console.warn('   Run: psql -U postgres -f schema.sql to initialize the database.\n');
  }

  const listen = (port) => {
    const server = app.listen(port, () => {
      console.log(`\n🚀 Server running on http://localhost:${port}`);
      console.log(`📋 API Health: http://localhost:${port}/health`);
      console.log(`\n🎯 Frontend Portals:`);
      console.log(`   Admin Panel:      http://localhost:3000`);
      console.log(`   Manager Panel:    http://localhost:3001`);
      console.log(`   Staff Panel:      http://localhost:3002`);
      console.log(`   Accountant Panel: http://localhost:3003`);
      console.log(`\n🔑 Demo Credentials (password: Admin@123):`);
      console.log(`   Admin:      admin@hps.com`);
      console.log(`   Manager:    manager@hps.com`);
      console.log(`   Staff:      staff@hps.com`);
      console.log(`   Accountant: accountant@hps.com\n`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`⚠️  Port ${port} is already in use. trying port ${port + 1}...`);
        listen(port + 1);
      } else {
        console.error('❌ Server error:', err);
      }
    });
  };

  listen(PORT);
};

startServer().catch(console.error);
