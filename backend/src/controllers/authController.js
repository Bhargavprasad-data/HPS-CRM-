const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');
const { generateTokens, verifyRefreshToken } = require('../config/jwt');
const { sendEmail, templates } = require('../config/mail');
const cloudinary = require('../config/cloudinary');

const saveBase64Image = (base64Str, folder = 'employees') => {
  if (!base64Str || !base64Str.startsWith('data:image')) {
    return base64Str;
  }
  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return null;
    }
    const ext = matches[1].split('/')[1] || 'png';
    const dataBuffer = Buffer.from(matches[2], 'base64');
    
    const uploadsDir = path.join(__dirname, '../../uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, dataBuffer);
    
    return `/uploads/${folder}/${filename}`;
  } catch (err) {
    console.error('Failed to save base64 image locally:', err);
    return null;
  }
};

const getFullUrl = (req, photoUrl) => {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http')) return photoUrl;
  const protocol = req.protocol;
  const host = req.get('host');
  const cleanPath = photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`;
  return `${protocol}://${host}${cleanPath}`;
};

// Role -> Portal URL mapping
const ROLE_PORTALS = {
  Admin: 'http://localhost:3000',
  Manager: 'http://localhost:3001',
  Staff: 'http://localhost:3002',
  Accountant: 'http://localhost:3003',
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const result = await query(
      `SELECT u.id, u.email, u.password_hash, u.is_active, r.name as role, r.id as role_id,
              e.id as employee_id, e.name as employee_name, e.photo_url
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN employees e ON e.user_id = u.id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Your account has been deactivated. Contact admin.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const { accessToken, refreshToken } = generateTokens(payload);

    // Store refresh token in DB
    await query('UPDATE users SET refresh_token = $1, last_login = NOW() WHERE id = $2', [refreshToken, user.id]);

    // Log audit
    await query(
      'INSERT INTO audit_logs (user_id, action, entity_type, ip_address) VALUES ($1, $2, $3, $4)',
      [user.id, 'LOGIN', 'USER', req.ip]
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          employeeId: user.employee_id,
          name: user.employee_name,
          photo: getFullUrl(req, user.photo_url),
          portal: ROLE_PORTALS[user.role],
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required.' });
    }

    const decoded = verifyRefreshToken(refreshToken);

    const result = await query(
      'SELECT id, email, role_id, refresh_token FROM users WHERE id = $1 AND refresh_token = $2',
      [decoded.userId, refreshToken]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const user = result.rows[0];
    const roleResult = await query('SELECT name FROM roles WHERE id = $1', [user.role_id]);
    const role = roleResult.rows[0]?.name;

    const payload = { userId: user.id, email: user.email, role };
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload);

    await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [newRefreshToken, user.id]);

    res.json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Refresh token expired. Please login again.' });
    }
    next(error);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    await query('UPDATE users SET refresh_token = NULL WHERE id = $1', [req.user.userId]);
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.created_at, r.name as role,
              e.id as employee_id, e.name, e.employee_code, e.department,
              e.designation, e.phone, e.photo_url, e.address, e.bank_account,
              e.ifsc_code, e.pan_number,
              COALESCE(
                NULLIF(e.salary, 0),
                (SELECT basic_salary FROM payrolls WHERE employee_id = e.id ORDER BY year DESC, month DESC LIMIT 1),
                0
              ) AS salary,
              e.joining_date, e.emergency_contact
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN employees e ON e.user_id = u.id
       WHERE u.id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userObj = result.rows[0];
    if (userObj.photo_url) {
      userObj.photo_url = getFullUrl(req, userObj.photo_url);
    }
    res.json({ success: true, data: userObj });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/update-profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, photo_url } = req.body;
    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const checkEmail = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email.toLowerCase().trim(), req.user.userId]);
    if (checkEmail.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email is already in use.' });
    }

    // Process photo if provided
    let finalPhotoUrl = undefined;
    if (photo_url) {
      if (photo_url.startsWith('data:image')) {
        try {
          const uploadResult = await cloudinary.uploader.upload(photo_url, { folder: 'hps_crm/employees' });
          finalPhotoUrl = uploadResult.secure_url;
        } catch (e) {
          console.warn('Profile photo update to Cloudinary failed, saving locally:', e.message);
          finalPhotoUrl = saveBase64Image(photo_url, 'employees');
        }
      } else {
        finalPhotoUrl = photo_url;
      }
    }

    await query('UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2', [email.toLowerCase().trim(), req.user.userId]);
    
    if (finalPhotoUrl !== undefined) {
      await query(
        'UPDATE employees SET name = $1, email = $2, photo_url = $3, updated_at = NOW() WHERE user_id = $4',
        [name, email.toLowerCase().trim(), finalPhotoUrl, req.user.userId]
      );
    } else {
      await query(
        'UPDATE employees SET name = $1, email = $2, updated_at = NOW() WHERE user_id = $3',
        [name, email.toLowerCase().trim(), req.user.userId]
      );
    }

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        name,
        email,
        photo: finalPhotoUrl ? getFullUrl(req, finalPhotoUrl) : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.userId]);
    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.userId]);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/register
const register = async (req, res, next) => {
  const client = await require('../config/db').getClient();
  try {
    const { name, email, password, phone, department, designation, photo_url, role = 'Staff' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    // Check if email already in use
    const emailCheck = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email is already in use.' });
    }

    // Fetch the role requested (default to Staff)
    const roleResult = await client.query("SELECT id FROM roles WHERE name = $1", [role]);
    const roleId = roleResult.rows[0]?.id;
    if (!roleId) {
      return res.status(400).json({ success: false, message: `Role '${role}' is not configured in the system.` });
    }

    // Upload photo if provided in request
    let finalPhotoUrl = null;
    if (photo_url) {
      try {
        const uploadResult = await cloudinary.uploader.upload(photo_url, { folder: 'hps_crm/employees' });
        finalPhotoUrl = uploadResult.secure_url;
      } catch (e) {
        console.warn('Signup photo upload to Cloudinary failed, saving locally:', e.message);
        finalPhotoUrl = saveBase64Image(photo_url, 'employees');
      }
    }

    // Begin transaction
    await client.query('BEGIN');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const userResult = await client.query(
      'INSERT INTO users (email, password_hash, role_id, is_active) VALUES ($1, $2, $3, true) RETURNING id',
      [email.toLowerCase().trim(), passwordHash, roleId]
    );
    const userId = userResult.rows[0].id;

    // Generate unique employee code
    const countResult = await client.query("SELECT COUNT(*) FROM employees");
    const count = parseInt(countResult.rows[0].count) + 1;
    const employeeCode = `HPS-${String(count).padStart(3, '0')}`;

    // Insert employee
    const empResult = await client.query(
      `INSERT INTO employees (
        user_id, employee_code, name, email, phone, department, designation,
        salary, joining_date, photo_url, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, NOW(), $8, true)
      RETURNING id, employee_code`,
      [
        userId,
        employeeCode,
        name.trim(),
        email.toLowerCase().trim(),
        phone ? phone.trim() : null,
        department ? department.trim() : null,
        designation ? designation.trim() : null,
        finalPhotoUrl
      ]
    );

    await client.query('COMMIT');

    // Send welcome email asynchronously
    try {
      const { subject, html } = templates.welcome(name, email, password);
      await sendEmail({ to: email, subject, html });
      // Log email
      await query(
        'INSERT INTO email_logs (recipient, subject, template_name, status) VALUES ($1, $2, $3, $4)',
        [email, subject, 'welcome', 'Sent']
      );
    } catch (emailError) {
      console.warn('Welcome email could not be sent:', emailError.message);
    }

    // Log audit
    await query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values) VALUES ($1, $2, $3, $4, $5)',
      [userId, 'REGISTER_STAFF', 'EMPLOYEE', empResult.rows[0].id, JSON.stringify(empResult.rows[0])]
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please log in to access your portal.',
      data: {
        id: userId,
        email: email.toLowerCase().trim(),
        employeeCode: empResult.rows[0].employee_code
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

module.exports = { login, refreshToken, logout, getMe, updateProfile, changePassword, register };

