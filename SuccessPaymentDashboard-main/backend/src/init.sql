-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'front_office_operator',
  created_at TIMESTAMP DEFAULT NOW(),
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  mfa_pending_secret VARCHAR(255)
);

-- MFA backup codes table
CREATE TABLE IF NOT EXISTS mfa_backup_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash VARCHAR(255) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  reference VARCHAR(100) UNIQUE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'EUR',
  state VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(100),
  terminal_id INTEGER,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Terminals table
CREATE TABLE IF NOT EXISTS terminals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  serial_number VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  location VARCHAR(255),
  model VARCHAR(100),
  last_activity TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Terminal transactions (PAX webhook)
CREATE TABLE IF NOT EXISTS terminal_transactions (
  id                 SERIAL PRIMARY KEY,
  uti                VARCHAR(100) UNIQUE NOT NULL,
  status             VARCHAR(20),
  transaction_type   VARCHAR(20),
  amount_cents       INTEGER,
  auth_code          VARCHAR(50),
  reason             VARCHAR(50),
  transaction_source VARCHAR(20),
  trans_cancelled    BOOLEAN,
  tid                VARCHAR(50),
  mid                VARCHAR(50),
  pan                VARCHAR(20),
  card_type          VARCHAR(100),
  aid                VARCHAR(50),
  transaction_date   TIMESTAMP,
  terminal_sn        VARCHAR(50),
  timestamp          TIMESTAMP,
  created_at         TIMESTAMP DEFAULT NOW()
);

-- Seed: default admin user (password: Admin123)
-- Hash generated via: node -e "require('bcryptjs').hash('Admin123',10).then(console.log)"
INSERT INTO users (email, name, password_hash, role)
VALUES ('admin@dashboard.local', 'Admin', '$2a$10$pIj.rJ0xjsZNcCp2RHjdZODkXYBy8QcU4U43MbcwZkOyQjiGxKI4K', 'hotel_manager')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, name, password_hash, role)
VALUES
  ('frontoffice.manager@dashboard.local', 'Front Office Manager', '$2a$10$pIj.rJ0xjsZNcCp2RHjdZODkXYBy8QcU4U43MbcwZkOyQjiGxKI4K', 'front_office_manager'),
  ('frontoffice.operator@dashboard.local', 'Front Office Operator', '$2a$10$pIj.rJ0xjsZNcCp2RHjdZODkXYBy8QcU4U43MbcwZkOyQjiGxKI4K', 'front_office_operator')
ON CONFLICT (email) DO NOTHING;

-- Seed: sample terminals
INSERT INTO terminals (name, serial_number, status, location, model) VALUES
  ('Terminal Paris 1', 'TRM-001-PAR', 'active', 'Paris - Rue de Rivoli', 'Ingenico Move 5000'),
  ('Terminal Lyon 1',  'TRM-002-LYO', 'active', 'Lyon - Place Bellecour', 'Verifone V400m'),
  ('Terminal Marseille 1', 'TRM-003-MRS', 'inactive', 'Marseille - La Canebière', 'Ingenico Desk 3500'),
  ('Terminal Bordeaux 1', 'TRM-004-BDX', 'active', 'Bordeaux - Cours de l''Intendance', 'Verifone V400m')
ON CONFLICT (serial_number) DO NOTHING;

-- Seed: sample transactions
INSERT INTO transactions (reference, amount, currency, state, payment_method, terminal_id, customer_name, customer_email, description, created_at) VALUES
  ('TXN-2024-001', 150.00, 'EUR', 'FULFILL', 'Carte Visa', 1, 'Jean Dupont', 'jean.dupont@email.com', 'Achat boutique', NOW() - INTERVAL '1 day'),
  ('TXN-2024-002', 89.99, 'EUR', 'FULFILL', 'Carte Mastercard', 2, 'Marie Martin', 'marie.martin@email.com', 'Paiement service', NOW() - INTERVAL '2 days'),
  ('TXN-2024-003', 320.50, 'EUR', 'FAILED', 'Carte Visa', 1, 'Pierre Bernard', 'pierre.bernard@email.com', 'Commande en ligne', NOW() - INTERVAL '3 days'),
  ('TXN-2024-004', 45.00, 'EUR', 'pending', 'Carte Amex', 3, 'Sophie Leroy', 'sophie.leroy@email.com', 'Abonnement mensuel', NOW() - INTERVAL '4 days'),
  ('TXN-2024-005', 210.75, 'EUR', 'FULFILL', 'Virement', 4, 'Lucas Moreau', 'lucas.moreau@email.com', 'Facture pro', NOW() - INTERVAL '5 days'),
  ('TXN-2024-006', 75.20, 'EUR', 'refunded', 'Carte Visa', 2, 'Emma Simon', 'emma.simon@email.com', 'Remboursement', NOW() - INTERVAL '6 days'),
  ('TXN-2024-007', 500.00, 'EUR', 'FULFILL', 'Carte Mastercard', 1, 'Hugo Laurent', 'hugo.laurent@email.com', 'Achat équipement', NOW() - INTERVAL '7 days'),
  ('TXN-2024-008', 33.50, 'EUR', 'FULFILL', 'Carte Visa', 3, 'Chloé Thomas', 'chloe.thomas@email.com', 'Petit achat', NOW() - INTERVAL '8 days')
ON CONFLICT (reference) DO NOTHING;
