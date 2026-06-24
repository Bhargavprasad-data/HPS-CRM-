const { query } = require('./src/config/db');

const clean = async () => {
  try {
    console.log('Starting database cleaning...');
    await query('TRUNCATE TABLE audit_logs CASCADE;');
    await query('TRUNCATE TABLE reports CASCADE;');
    await query('TRUNCATE TABLE notifications CASCADE;');
    await query('TRUNCATE TABLE email_logs CASCADE;');
    await query('TRUNCATE TABLE id_cards CASCADE;');
    await query('TRUNCATE TABLE offer_letters CASCADE;');
    await query('TRUNCATE TABLE invoice_items CASCADE;');
    await query('TRUNCATE TABLE invoices CASCADE;');
    await query('TRUNCATE TABLE quotation_items CASCADE;');
    await query('TRUNCATE TABLE quotations CASCADE;');
    await query('TRUNCATE TABLE tickets CASCADE;');
    await query('TRUNCATE TABLE project_assignments CASCADE;');
    await query('TRUNCATE TABLE projects CASCADE;');
    await query('TRUNCATE TABLE customers CASCADE;');
    await query('TRUNCATE TABLE payrolls CASCADE;');
    await query('TRUNCATE TABLE leaves CASCADE;');
    await query('TRUNCATE TABLE attendance CASCADE;');
    console.log('Database cleaned successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning database:', error);
    process.exit(1);
  }
};

clean();
