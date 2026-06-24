const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'HPS CRM'}" <${process.env.EMAIL_FROM || 'noreply@hpscrm.com'}>`,
      to,
      subject,
      html,
      attachments,
    });
    console.log(`✅ Email sent to ${to} | MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email failed to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Email Templates
const templates = {
  welcome: (name, email, password) => ({
    subject: 'Welcome to HPS CRM - Your Account Details',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to HPS CRM</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Harsha Perfect Solutions</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <h2 style="color: #1a1a2e; margin-top: 0;">Hello, ${name}! 👋</h2>
          <p style="color: #555; line-height: 1.6;">Your HPS CRM account has been created successfully. Here are your login credentials:</p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #333;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Password:</strong> ${password}</p>
          </div>
          <p style="color: #e53e3e; font-size: 14px;">⚠️ Please change your password after your first login.</p>
          <div style="text-align: center; margin-top: 25px;">
            <a href="http://localhost:3000" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Login to HPS CRM</a>
          </div>
        </div>
        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 Harsha Perfect Solutions. All rights reserved.</p>
      </div>
    `,
  }),

  salarySlip: (name, month, year, netSalary, pdfAttachment) => ({
    subject: `Salary Slip - ${month}/${year}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 25px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">Salary Slip</h1>
          <p style="color: rgba(255,255,255,0.9);">${month}/${year}</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <p>Dear <strong>${name}</strong>,</p>
          <p>Please find attached your salary slip for <strong>${month}/${year}</strong>.</p>
          <div style="background: #f0fff4; border-left: 4px solid #38a169; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px; color: #276749;"><strong>Net Salary: ₹${netSalary.toLocaleString('en-IN')}</strong></p>
          </div>
          <p style="color: #666;">If you have any queries, please contact the HR department.</p>
        </div>
      </div>
    `,
  }),

  quotation: (customerName, quotationNumber, total) => ({
    subject: `Quotation ${quotationNumber} from HPS CRM`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 25px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">Quotation</h1>
          <p style="color: rgba(255,255,255,0.9);">${quotationNumber}</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <p>Dear <strong>${customerName}</strong>,</p>
          <p>Please find attached our quotation for your requirements.</p>
          <div style="background: #fff5f5; border-left: 4px solid #f56565; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px; color: #c53030;"><strong>Total Amount: ₹${total.toLocaleString('en-IN')}</strong></p>
          </div>
        </div>
      </div>
    `,
  }),

  invoice: (customerName, invoiceNumber, total, dueDate) => ({
    subject: `Invoice ${invoiceNumber} from HPS CRM`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 25px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">Invoice</h1>
          <p style="color: rgba(255,255,255,0.9);">${invoiceNumber}</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <p>Dear <strong>${customerName}</strong>,</p>
          <p>Please find attached your invoice. Kindly process the payment at the earliest.</p>
          <div style="background: #ebf8ff; border-left: 4px solid #4299e1; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px; color: #2b6cb0;"><strong>Total: ₹${total.toLocaleString('en-IN')}</strong></p>
            <p style="margin: 5px 0; color: #666;">Due Date: ${dueDate}</p>
          </div>
        </div>
      </div>
    `,
  }),

  paymentReminder: (customerName, invoiceNumber, total, dueDate) => ({
    subject: `Payment Reminder - Invoice ${invoiceNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%); padding: 25px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">⚠️ Payment Reminder</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <p>Dear <strong>${customerName}</strong>,</p>
          <p>This is a friendly reminder that the following invoice is pending payment:</p>
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;"><strong>Invoice: ${invoiceNumber}</strong></p>
            <p style="margin: 5px 0; color: #92400e;"><strong>Amount: ₹${total.toLocaleString('en-IN')}</strong></p>
            <p style="margin: 5px 0; color: #dc2626;"><strong>Due Date: ${dueDate}</strong></p>
          </div>
          <p>Please process the payment to avoid any late charges.</p>
        </div>
      </div>
    `,
  }),
};

module.exports = { sendEmail, templates };
