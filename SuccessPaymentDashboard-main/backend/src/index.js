const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dashboard-local-secret';
const JWT_EXPIRES_IN = '1h';
const REFRESH_EXPIRES_IN = '7d';
const MFA_TOKEN_EXPIRES_IN = '5m'; // short-lived token for MFA challenge
const SUPER_ADMIN_ROLE = 'super_admin';

const PERMISSIONS = {
  VIEW_PAYMENT_DATA: 'view_payment_data',
  VIEW_TRANSACTIONS: 'view_transactions',
  GENERATE_REPORTS: 'generate_reports',
  EXPORT_REPORTS: 'export_reports',
  VIEW_EOD_REPORTS: 'view_eod_reports',
  USE_VIRTUAL_TERMINAL: 'use_virtual_terminal',
  VIEW_TERMINALS: 'view_terminals',
  MANAGE_TERMINALS: 'manage_terminals',
  ACCESS_ECOMMERCE_DATA: 'access_ecommerce_data',
  ACCESS_STANDARD_PREMIUM: 'access_standard_premium',
  MANAGE_USERS: 'manage_users',
  MODIFY_SYSTEM_CONFIG: 'modify_system_config',
  MODIFY_GLOBAL_SETTINGS: 'modify_global_settings',
};
const ALL_PERMISSIONS = Object.values(PERMISSIONS);
const ROLE_PERMISSIONS = {
  super_admin: ALL_PERMISSIONS,
  hotel_manager: ALL_PERMISSIONS,
  financial_manager: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  front_office_manager: [
    PERMISSIONS.VIEW_PAYMENT_DATA,
    PERMISSIONS.VIEW_TRANSACTIONS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_EOD_REPORTS,
    PERMISSIONS.USE_VIRTUAL_TERMINAL,
  ],
  front_office_operator: [
    PERMISSIONS.VIEW_PAYMENT_DATA,
    PERMISSIONS.VIEW_TRANSACTIONS,
  ],
};

app.use(cors({ origin: '*' }));
app.use(express.json());

async function ensureSchema() {
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(255),
      ADD COLUMN IF NOT EXISTS mfa_pending_secret VARCHAR(255)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS mfa_backup_codes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash VARCHAR(255) NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // ── Multi-tenant: customers ──────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(100),
      address TEXT,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // ── Properties (hotel / restaurant / retail) per customer ───────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS properties (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) DEFAULT 'hotel',
      address TEXT,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // ── Scope users to a customer (NULL = super-admin / platform user) ───────────
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL
  `);

  // ── User → Property roles (many-to-many with role per property) ──────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_property_roles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      role VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, property_id)
    )
  `);

  // ── Scope transactions and terminals to a customer ────────────────────────────
  await pool.query(`
    ALTER TABLE transactions
      ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL
  `);
  await pool.query(`
    ALTER TABLE terminals
      ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL
  `);

  // ── Password reset tokens ────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // ── Ensure admin@dashboard.local is super_admin ──────────────────────────────
  await pool.query(`
    UPDATE users SET role = 'super_admin' WHERE email = 'admin@dashboard.local'
  `);
}

function normalizeRole(role) {
  if (!role) return 'front_office_operator';
  return String(role).trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function hasPermission(role, permission) {
  const normalizedRole = normalizeRole(role);
  return (ROLE_PERMISSIONS[normalizedRole] || []).includes(permission);
}

// ─── Middleware: auth ─────────────────────────────────────────────────────────
function requirePermission(permission) {
  return (req, res, next) => {
    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ message: 'Accès interdit' });
    }
    next();
  };
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant' });
  }
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
}

function makeTokens(user) {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: normalizeRole(user.role),
    customer_id: user.customer_id || null,
  };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
}

// ── Multi-tenant helper ───────────────────────────────────────────────────────
// Returns { where: 'WHERE customer_id = $1', params: [id] } for non-admin users
// or     { where: '', params: [] } if super_admin with no filter
// or     { where: 'WHERE customer_id = $1', params: [cid] } if super_admin filtered
function tenantFilter(req, paramOffset = 0) {
  const isSA = normalizeRole(req.user.role) === SUPER_ADMIN_ROLE;
  // super_admin can optionally filter via ?customer_id=X query param
  const requestedCid = req.query.customer_id ? parseInt(req.query.customer_id) : null;

  if (isSA) {
    if (requestedCid) {
      return { clause: `WHERE customer_id = $${paramOffset + 1}`, params: [requestedCid] };
    }
    return { clause: '', params: [] };
  }

  // Non-super-admin: must be scoped to their customer
  const cid = req.user.customer_id;
  if (!cid) {
    // No customer assigned → no data
    return { clause: `WHERE customer_id = $${paramOffset + 1}`, params: [-1] };
  }
  return { clause: `WHERE customer_id = $${paramOffset + 1}`, params: [cid] };
}

function makeMfaToken(user) {
  return jwt.sign({ id: user.id, mfa_challenge: true }, JWT_SECRET, { expiresIn: MFA_TOKEN_EXPIRES_IN });
}

function generateBackupCodes() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(5).toString('hex').toUpperCase()); // e.g. "A3F2B9C1E0"
  }
  return codes;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Identifiants incorrects' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Identifiants incorrects' });

    // If MFA is enabled, return a short-lived challenge token instead of full tokens
    if (user.mfa_enabled) {
      const mfaToken = makeMfaToken(user);
      return res.json({ mfaRequired: true, mfaToken });
    }

    const { accessToken, refreshToken } = makeTokens(user);
    res.json({
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      email: user.email,
      name: user.name,
      role: normalizeRole(user.role),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Verify MFA OTP during login (also accepts backup codes)
app.post('/api/auth/mfa/login-verify', async (req, res) => {
  const { mfaToken, code } = req.body;
  if (!mfaToken || !code) {
    return res.status(400).json({ message: 'mfaToken et code requis' });
  }
  try {
    let decoded;
    try {
      decoded = jwt.verify(mfaToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Token MFA invalide ou expiré' });
    }
    if (!decoded.mfa_challenge) {
      return res.status(401).json({ message: 'Token invalide' });
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    const user = rows[0];
    if (!user || !user.mfa_enabled || !user.mfa_secret) {
      return res.status(401).json({ message: 'MFA non configuré' });
    }

    // Try TOTP first
    const totpValid = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: code.replace(/\s/g, ''),
      window: 1,
    });

    if (totpValid) {
      const { accessToken, refreshToken } = makeTokens(user);
      return res.json({ accessToken, refreshToken, tokenType: 'Bearer', expiresIn: 3600, email: user.email, name: user.name, role: normalizeRole(user.role) });
    }

    // Try backup code
    const normalizedCode = code.replace(/\s|-/g, '').toUpperCase();
    const { rows: backupRows } = await pool.query(
      'SELECT * FROM mfa_backup_codes WHERE user_id = $1 AND used = FALSE',
      [user.id]
    );
    for (const row of backupRows) {
      const match = await bcrypt.compare(normalizedCode, row.code_hash);
      if (match) {
        await pool.query(
          'UPDATE mfa_backup_codes SET used = TRUE, used_at = NOW() WHERE id = $1',
          [row.id]
        );
        const { accessToken, refreshToken } = makeTokens(user);
        return res.json({ accessToken, refreshToken, tokenType: 'Bearer', expiresIn: 3600, email: user.email, name: user.name, role: normalizeRole(user.role), usedBackupCode: true });
      }
    }

    return res.status(401).json({ message: 'Code invalide' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'refreshToken requis' });
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });
    const tokens = makeTokens(user);
    res.json({ ...tokens, tokenType: 'Bearer', expiresIn: 3600, email: user.email, name: user.name, role: normalizeRole(user.role) });
  } catch {
    res.status(401).json({ message: 'Refresh token invalide' });
  }
});

app.get('/api/auth/validate', requireAuth, (req, res) => {
  res.json({ valid: true, user: req.user });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Déconnecté' });
});

// ─── MFA Management ───────────────────────────────────────────────────────────

// Get current MFA status
app.get('/api/auth/mfa/status', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT mfa_enabled FROM users WHERE id = $1',
      [req.user.id]
    );
    const { rows: backupRows } = await pool.query(
      'SELECT COUNT(*) AS remaining FROM mfa_backup_codes WHERE user_id = $1 AND used = FALSE',
      [req.user.id]
    );
    res.json({
      mfaEnabled: rows[0]?.mfa_enabled || false,
      backupCodesRemaining: parseInt(backupRows[0]?.remaining || '0'),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Start MFA setup: generate secret + QR code
app.post('/api/auth/mfa/setup', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = rows[0];
    if (user.mfa_enabled) {
      return res.status(400).json({ message: 'MFA déjà activé' });
    }

    const secret = speakeasy.generateSecret({ name: `Dashboard (${user.email})`, length: 20 });
    // Store pending secret (not yet confirmed)
    await pool.query('UPDATE users SET mfa_pending_secret = $1 WHERE id = $2', [secret.base32, user.id]);

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ secret: secret.base32, qrCode: qrCodeUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Confirm MFA setup: verify OTP then activate + generate backup codes
app.post('/api/auth/mfa/confirm', requireAuth, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Code requis' });
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = rows[0];
    if (!user.mfa_pending_secret) {
      return res.status(400).json({ message: 'Aucun setup en cours' });
    }

    const valid = speakeasy.totp.verify({
      secret: user.mfa_pending_secret,
      encoding: 'base32',
      token: code.replace(/\s/g, ''),
      window: 1,
    });
    if (!valid) return res.status(401).json({ message: 'Code invalide' });

    // Activate MFA
    await pool.query(
      'UPDATE users SET mfa_enabled = TRUE, mfa_secret = mfa_pending_secret, mfa_pending_secret = NULL WHERE id = $1',
      [user.id]
    );

    // Generate 10 backup codes
    const plainCodes = generateBackupCodes();
    // Delete any existing backup codes
    await pool.query('DELETE FROM mfa_backup_codes WHERE user_id = $1', [user.id]);
    for (const code of plainCodes) {
      const hash = await bcrypt.hash(code, 10);
      await pool.query(
        'INSERT INTO mfa_backup_codes (user_id, code_hash) VALUES ($1, $2)',
        [user.id, hash]
      );
    }

    // Return plain codes once — they won't be shown again
    res.json({ backupCodes: plainCodes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Disable MFA (requires valid OTP or backup code + password)
app.post('/api/auth/mfa/disable', requireAuth, async (req, res) => {
  const { code, password } = req.body;
  if (!code || !password) return res.status(400).json({ message: 'Code et mot de passe requis' });
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = rows[0];
    if (!user.mfa_enabled) return res.status(400).json({ message: 'MFA non activé' });

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) return res.status(401).json({ message: 'Mot de passe incorrect' });

    const totpValid = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: code.replace(/\s/g, ''),
      window: 1,
    });

    let backupCodeId = null;
    if (!totpValid) {
      const normalizedCode = code.replace(/\s|-/g, '').toUpperCase();
      const { rows: backupRows } = await pool.query(
        'SELECT * FROM mfa_backup_codes WHERE user_id = $1 AND used = FALSE',
        [user.id]
      );

      for (const row of backupRows) {
        const match = await bcrypt.compare(normalizedCode, row.code_hash);
        if (match) {
          backupCodeId = row.id;
          break;
        }
      }

      if (!backupCodeId) {
        return res.status(401).json({ message: 'Code invalide' });
      }
    }

    if (backupCodeId) {
      await pool.query(
        'UPDATE mfa_backup_codes SET used = TRUE, used_at = NOW() WHERE id = $1',
        [backupCodeId]
      );
    }

    await pool.query(
      'UPDATE users SET mfa_enabled = FALSE, mfa_secret = NULL, mfa_pending_secret = NULL WHERE id = $1',
      [user.id]
    );
    await pool.query('DELETE FROM mfa_backup_codes WHERE user_id = $1', [user.id]);

    res.json({ message: 'MFA désactivé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Regenerate backup codes (requires valid OTP)
app.post('/api/auth/mfa/backup-codes/regenerate', requireAuth, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Code OTP requis' });
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = rows[0];
    if (!user.mfa_enabled) return res.status(400).json({ message: 'MFA non activé' });

    const totpValid = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: code.replace(/\s/g, ''),
      window: 1,
    });
    if (!totpValid) return res.status(401).json({ message: 'Code invalide' });

    const plainCodes = generateBackupCodes();
    await pool.query('DELETE FROM mfa_backup_codes WHERE user_id = $1', [user.id]);
    for (const c of plainCodes) {
      const hash = await bcrypt.hash(c, 10);
      await pool.query('INSERT INTO mfa_backup_codes (user_id, code_hash) VALUES ($1, $2)', [user.id, hash]);
    }

    res.json({ backupCodes: plainCodes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─── User ─────────────────────────────────────────────────────────────────────
app.get('/api/user/profile', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.put('/api/user/profile', requireAuth, async (req, res) => {
  const { name } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, email, name, role',
      [name, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─── Transactions ─────────────────────────────────────────────────────────────
app.get('/api/payment/transactions', requireAuth, requirePermission(PERMISSIONS.VIEW_TRANSACTIONS), async (req, res) => {
  try {
    const { clause, params } = tenantFilter(req);
    const { rows } = await pool.query(
      `SELECT * FROM transactions ${clause} ORDER BY created_at DESC`,
      params
    );
    res.json({ items: rows, total: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/payment/transactions/stats', requireAuth, requirePermission(PERMISSIONS.VIEW_PAYMENT_DATA), async (req, res) => {
  try {
    const { clause, params } = tenantFilter(req);
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(amount) FILTER (WHERE state = 'FULFILL'), 0) AS total_amount,
        COUNT(*) FILTER (WHERE state = 'FULFILL') AS fulfilled,
        COUNT(*) FILTER (WHERE state = 'FAILED') AS failed,
        COUNT(*) FILTER (WHERE state = 'pending') AS pending,
        COUNT(*) FILTER (WHERE state = 'refunded') AS refunded
      FROM transactions ${clause}
    `, params);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/payment/transactions/:id', requireAuth, requirePermission(PERMISSIONS.VIEW_TRANSACTIONS), async (req, res) => {
  try {
    const { clause, params } = tenantFilter(req);
    const andClause = clause ? clause.replace('WHERE', 'AND') : '';
    const { rows } = await pool.query(
      `SELECT * FROM transactions WHERE id = $${params.length + 1} ${andClause}`,
      [...params, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Transaction introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/payment/transactions', requireAuth, requirePermission(PERMISSIONS.USE_VIRTUAL_TERMINAL), async (req, res) => {
  const { reference, amount, currency, state, payment_method, terminal_id, customer_name, customer_email, description } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO transactions (reference, amount, currency, state, payment_method, terminal_id, customer_name, customer_email, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [reference, amount, currency || 'EUR', state || 'pending', payment_method, terminal_id, customer_name, customer_email, description]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.put('/api/payment/transactions/:id', requireAuth, requirePermission(PERMISSIONS.USE_VIRTUAL_TERMINAL), async (req, res) => {
  const { amount, currency, state, payment_method, customer_name, customer_email, description } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE transactions SET amount=$1, currency=$2, state=$3, payment_method=$4,
       customer_name=$5, customer_email=$6, description=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [amount, currency, state, payment_method, customer_name, customer_email, description, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Transaction introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.delete('/api/payment/transactions/:id', requireAuth, requirePermission(PERMISSIONS.MODIFY_SYSTEM_CONFIG), async (req, res) => {
  try {
    await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─── Terminals ────────────────────────────────────────────────────────────────
app.get('/api/terminals', requireAuth, requirePermission(PERMISSIONS.VIEW_TERMINALS), async (req, res) => {
  try {
    const { clause, params } = tenantFilter(req);
    const { rows } = await pool.query(
      `SELECT * FROM terminals ${clause} ORDER BY created_at DESC`,
      params
    );
    res.json({ items: rows, total: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/terminals/:id', requireAuth, requirePermission(PERMISSIONS.VIEW_TERMINALS), async (req, res) => {
  try {
    const { clause, params } = tenantFilter(req);
    const andClause = clause ? clause.replace('WHERE', 'AND') : '';
    const { rows } = await pool.query(
      `SELECT * FROM terminals WHERE id = $${params.length + 1} ${andClause}`,
      [...params, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Terminal introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/terminals', requireAuth, requirePermission(PERMISSIONS.MANAGE_TERMINALS), async (req, res) => {
  const { name, serial_number, status, location, model } = req.body;
  const customer_id = req.user.customer_id || null;
  try {
    const { rows } = await pool.query(
      'INSERT INTO terminals (name, serial_number, status, location, model, customer_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, serial_number, status || 'active', location, model, customer_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.put('/api/terminals/:id', requireAuth, requirePermission(PERMISSIONS.MANAGE_TERMINALS), async (req, res) => {
  const { name, status, location, model } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE terminals SET name=$1, status=$2, location=$3, model=$4 WHERE id=$5 RETURNING *',
      [name, status, location, model, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Terminal introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.delete('/api/terminals/:id', requireAuth, requirePermission(PERMISSIONS.MANAGE_TERMINALS), async (req, res) => {
  try {
    await pool.query('DELETE FROM terminals WHERE id = $1', [req.params.id]);
    res.json({ message: 'Supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─── Dashboard ────────────────────────────────────────────────────────────────
app.get('/api/dashboard/overview', requireAuth, requirePermission(PERMISSIONS.VIEW_PAYMENT_DATA), async (req, res) => {
  try {
    const { clause, params } = tenantFilter(req);
    const txResult = await pool.query(`
      SELECT
        COUNT(*) AS total_transactions,
        COALESCE(SUM(amount) FILTER (WHERE state = 'FULFILL'), 0) AS total_revenue,
        COUNT(*) FILTER (WHERE state = 'FULFILL') AS successful,
        COUNT(*) FILTER (WHERE state = 'FAILED') AS failed
      FROM transactions ${clause}
    `, params);
    const termResult = await pool.query(
      `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'active') AS active FROM terminals ${clause}`,
      params
    );
    res.json({
      transactions: txResult.rows[0],
      terminals: termResult.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/dashboard/stats', requireAuth, requirePermission(PERMISSIONS.GENERATE_REPORTS), async (req, res) => {
  try {
    const { clause, params } = tenantFilter(req);
    const andOrWhere = clause ? clause.replace('WHERE', 'AND') : '';
    const { rows } = await pool.query(`
      SELECT
        DATE_TRUNC('day', created_at) AS day,
        COUNT(*) AS count,
        COALESCE(SUM(amount), 0) AS total
      FROM transactions
      WHERE created_at >= NOW() - INTERVAL '30 days'
      ${andOrWhere}
      GROUP BY day
      ORDER BY day
    `, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/dashboard/recent-activity', requireAuth, requirePermission(PERMISSIONS.VIEW_PAYMENT_DATA), async (req, res) => {
  try {
    const { clause, params } = tenantFilter(req);
    const { rows } = await pool.query(
      `SELECT * FROM transactions ${clause} ORDER BY created_at DESC LIMIT 10`,
      params
    );
    res.json({ activities: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─── Super-admin guard ────────────────────────────────────────────────────────
function requireSuperAdmin(req, res, next) {
  if (normalizeRole(req.user.role) !== SUPER_ADMIN_ROLE) {
    return res.status(403).json({ message: 'Super-admin access required' });
  }
  next();
}

// ─── Password reset (forgot / reset) ─────────────────────────────────────────
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requis' });
  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    // Always return success to avoid email enumeration
    if (rows[0]) {
      const token = crypto.randomBytes(32).toString('hex');
      const hash = await bcrypt.hash(token, 10);
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h
      await pool.query(
        'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [rows[0].id, hash, expires]
      );
      // In production: send email with reset link containing raw token
      console.log(`[RESET] token for ${email}: ${token}`);
    }
    res.json({ message: 'If this email exists, a reset link has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword, confirmNewPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ message: 'Token et mot de passe requis' });
  if (newPassword !== confirmNewPassword) return res.status(400).json({ message: 'Passwords do not match' });
  try {
    const { rows } = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE used = FALSE AND expires_at > NOW() ORDER BY created_at DESC'
    );
    let matched = null;
    for (const row of rows) {
      const ok = await bcrypt.compare(token, row.token_hash);
      if (ok) { matched = row; break; }
    }
    if (!matched) return res.status(400).json({ message: 'Token invalide ou expiré' });
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, matched.user_id]);
    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [matched.id]);
    res.json({ message: 'Mot de passe réinitialisé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Champs requis' });
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = rows[0];
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ message: 'Mot de passe modifié' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─── Customers (super_admin only) ─────────────────────────────────────────────
app.get('/api/admin/customers', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*,
        COUNT(DISTINCT p.id) AS property_count,
        COUNT(DISTINCT u.id) AS user_count
      FROM customers c
      LEFT JOIN properties p ON p.customer_id = c.id
      LEFT JOIN users u ON u.customer_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json({ items: rows, total: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/admin/customers/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Customer not found' });
    const { rows: props } = await pool.query('SELECT * FROM properties WHERE customer_id = $1 ORDER BY created_at', [req.params.id]);
    const { rows: users } = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE customer_id = $1 ORDER BY created_at',
      [req.params.id]
    );
    // Attach property_roles to each user
    const { rows: allRoles } = await pool.query(
      `SELECT upr.user_id, upr.property_id, upr.role, p.name AS property_name, p.type AS property_type
       FROM user_property_roles upr
       JOIN properties p ON p.id = upr.property_id
       WHERE p.customer_id = $1`,
      [req.params.id]
    );
    const usersWithRoles = users.map(u => ({
      ...u,
      property_roles: allRoles.filter(r => r.user_id === u.id).map(r => ({
        property_id: r.property_id,
        property_name: r.property_name,
        property_type: r.property_type,
        role: r.role,
      })),
    }));
    res.json({ ...rows[0], properties: props, users: usersWithRoles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/admin/customers', requireAuth, requireSuperAdmin, async (req, res) => {
  const { name, email, phone, address } = req.body;
  if (!name || !email) return res.status(400).json({ message: 'Name and email required' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO customers (name, email, phone, address) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, email, phone || null, address || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Email already exists' });
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.put('/api/admin/customers/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  const { name, email, phone, address, status } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE customers SET name=$1, email=$2, phone=$3, address=$4, status=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
      [name, email, phone || null, address || null, status || 'active', req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Customer not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.delete('/api/admin/customers/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─── Properties per customer ───────────────────────────────────────────────────
app.get('/api/admin/customers/:id/properties', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM properties WHERE customer_id = $1 ORDER BY created_at', [req.params.id]);
    res.json({ items: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/admin/customers/:id/properties', requireAuth, requireSuperAdmin, async (req, res) => {
  const { name, type, address } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO properties (customer_id, name, type, address) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.id, name, type || 'hotel', address || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.put('/api/admin/customers/:cid/properties/:pid', requireAuth, requireSuperAdmin, async (req, res) => {
  const { name, type, address, status } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE properties SET name=$1, type=$2, address=$3, status=$4 WHERE id=$5 AND customer_id=$6 RETURNING *',
      [name, type || 'hotel', address || null, status || 'active', req.params.pid, req.params.cid]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Property not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.delete('/api/admin/customers/:cid/properties/:pid', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM properties WHERE id=$1 AND customer_id=$2', [req.params.pid, req.params.cid]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─── Users per customer (admin management) ────────────────────────────────────
app.get('/api/admin/customers/:id/users', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE customer_id = $1 ORDER BY created_at',
      [req.params.id]
    );
    const { rows: allRoles } = await pool.query(
      `SELECT upr.user_id, upr.property_id, upr.role, p.name AS property_name, p.type AS property_type
       FROM user_property_roles upr
       JOIN properties p ON p.id = upr.property_id
       WHERE p.customer_id = $1`,
      [req.params.id]
    );
    const items = rows.map(u => ({
      ...u,
      property_roles: allRoles.filter(r => r.user_id === u.id).map(r => ({
        property_id: r.property_id,
        property_name: r.property_name,
        property_type: r.property_type,
        role: r.role,
      })),
    }));
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Helper: upsert property roles for a user
async function syncPropertyRoles(client, userId, customerId, propertyRoles) {
  // Delete existing roles for properties belonging to this customer
  await client.query(
    `DELETE FROM user_property_roles WHERE user_id = $1
     AND property_id IN (SELECT id FROM properties WHERE customer_id = $2)`,
    [userId, customerId]
  );
  if (propertyRoles && propertyRoles.length > 0) {
    for (const pr of propertyRoles) {
      if (!pr.property_id || !pr.role) continue;
      await client.query(
        `INSERT INTO user_property_roles (user_id, property_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, property_id) DO UPDATE SET role = EXCLUDED.role`,
        [userId, pr.property_id, pr.role]
      );
    }
  }
}

app.post('/api/admin/customers/:id/users', requireAuth, requireSuperAdmin, async (req, res) => {
  const { name, email, password, property_roles } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'name, email and password required' });
  // Derive a default role from the first property role (for backwards compat)
  const defaultRole = (property_roles && property_roles[0]?.role) || 'front_office_operator';
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await client.query(
      'INSERT INTO users (name, email, password_hash, role, customer_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, email, name, role, created_at',
      [name, email, hash, defaultRole, req.params.id]
    );
    const user = rows[0];
    await syncPropertyRoles(client, user.id, req.params.id, property_roles || []);
    await client.query('COMMIT');
    // Return with property_roles
    const { rows: roleRows } = await pool.query(
      `SELECT upr.property_id, upr.role, p.name AS property_name, p.type AS property_type
       FROM user_property_roles upr JOIN properties p ON p.id = upr.property_id
       WHERE upr.user_id = $1`,
      [user.id]
    );
    res.status(201).json({ ...user, property_roles: roleRows });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ message: 'Email already exists' });
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

app.put('/api/admin/customers/:cid/users/:uid', requireAuth, requireSuperAdmin, async (req, res) => {
  const { name, property_roles } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Derive default role from first property role
    const defaultRole = (property_roles && property_roles[0]?.role) || undefined;
    const updateRole = defaultRole
      ? 'UPDATE users SET name=$1, role=$2 WHERE id=$3 AND customer_id=$4 RETURNING id, email, name, role, created_at'
      : 'UPDATE users SET name=$1 WHERE id=$2 AND customer_id=$3 RETURNING id, email, name, role, created_at';
    const updateParams = defaultRole
      ? [name, defaultRole, req.params.uid, req.params.cid]
      : [name, req.params.uid, req.params.cid];
    const { rows } = await client.query(updateRole, updateParams);
    if (!rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'User not found' }); }
    await syncPropertyRoles(client, rows[0].id, req.params.cid, property_roles || []);
    await client.query('COMMIT');
    const { rows: roleRows } = await pool.query(
      `SELECT upr.property_id, upr.role, p.name AS property_name, p.type AS property_type
       FROM user_property_roles upr JOIN properties p ON p.id = upr.property_id
       WHERE upr.user_id = $1`,
      [rows[0].id]
    );
    res.json({ ...rows[0], property_roles: roleRows });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

app.delete('/api/admin/customers/:cid/users/:uid', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1 AND customer_id=$2', [req.params.uid, req.params.cid]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

async function start() {
  try {
    await ensureSchema();
    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize backend schema', err);
    process.exit(1);
  }
}

start();
