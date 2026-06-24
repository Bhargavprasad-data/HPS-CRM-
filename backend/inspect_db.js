const { query } = require('./src/config/db');

async function run() {
  try {
    const users = await query(`
      SELECT u.id, u.email, r.name as role_name, e.id as employee_id, e.name as employee_name, e.manager_id
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN employees e ON e.user_id = u.id
    `);
    console.log('--- USERS AND EMPLOYEES ---');
    console.log(users.rows);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

run();
