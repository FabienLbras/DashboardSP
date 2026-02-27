const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dashboard-local-secret';
const JWT_EXPIRES_IN = '1h';
const REFRESH_EXPIRES_IN = '7d';

app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Middleware: auth ─────────────────────────────────────────────────────────
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
  const payload = { id: user.id, email: user.email, name: user.name };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
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

    const { accessToken, refreshToken } = makeTokens(user);
    res.json({
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      email: user.email,
      name: user.name,
    });
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
    res.json({ ...tokens, tokenType: 'Bearer', expiresIn: 3600, email: user.email, name: user.name });
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
app.get('/api/payment/transactions', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM transactions ORDER BY created_at DESC'
    );
    res.json({ items: rows, total: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/payment/transactions/stats', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(amount) FILTER (WHERE state = 'FULFILL'), 0) AS total_amount,
        COUNT(*) FILTER (WHERE state = 'FULFILL') AS fulfilled,
        COUNT(*) FILTER (WHERE state = 'FAILED') AS failed,
        COUNT(*) FILTER (WHERE state = 'pending') AS pending,
        COUNT(*) FILTER (WHERE state = 'refunded') AS refunded
      FROM transactions
    `);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/payment/transactions/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM transactions WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Transaction introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/payment/transactions', requireAuth, async (req, res) => {
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

app.put('/api/payment/transactions/:id', requireAuth, async (req, res) => {
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

app.delete('/api/payment/transactions/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─── Terminals ────────────────────────────────────────────────────────────────
app.get('/api/terminals', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM terminals ORDER BY created_at DESC');
    res.json({ items: rows, total: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/terminals/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM terminals WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Terminal introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/terminals', requireAuth, async (req, res) => {
  const { name, serial_number, status, location, model } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO terminals (name, serial_number, status, location, model) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, serial_number, status || 'active', location, model]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.put('/api/terminals/:id', requireAuth, async (req, res) => {
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

app.delete('/api/terminals/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM terminals WHERE id = $1', [req.params.id]);
    res.json({ message: 'Supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─── Dashboard ────────────────────────────────────────────────────────────────
app.get('/api/dashboard/overview', requireAuth, async (req, res) => {
  try {
    const txResult = await pool.query(`
      SELECT
        COUNT(*) AS total_transactions,
        COALESCE(SUM(amount) FILTER (WHERE state = 'FULFILL'), 0) AS total_revenue,
        COUNT(*) FILTER (WHERE state = 'FULFILL') AS successful,
        COUNT(*) FILTER (WHERE state = 'FAILED') AS failed
      FROM transactions
    `);
    const termResult = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'active') AS active
      FROM terminals
    `);
    res.json({
      transactions: txResult.rows[0],
      terminals: termResult.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        DATE_TRUNC('day', created_at) AS day,
        COUNT(*) AS count,
        COALESCE(SUM(amount), 0) AS total
      FROM transactions
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY day
      ORDER BY day
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/dashboard/recent-activity', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10'
    );
    res.json({ activities: rows });
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

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
