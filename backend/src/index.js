import express from "express";
import cors from "cors";
import { config } from "dotenv";

config(); // loads backend/.env

const app = express();
const PORT = process.env.PORT || 4000;

const ZOHO_ACCOUNTS_URL = "https://accounts.zoho.eu/oauth/v2/token";
const ZOHO_API_BASE = "https://www.zohoapis.eu/books/v3";

const {
  ZOHO_CLIENT_ID,
  ZOHO_CLIENT_SECRET,
  ZOHO_REFRESH_TOKEN,
  ZOHO_ORGANIZATION_ID,
} = process.env;

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ── In-process token cache ────────────────────────────────────────────────────

let cachedToken = null;
let tokenExpiresAt = 0;

async function fetchAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) return cachedToken;

  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    throw new Error(
      "Zoho OAuth env vars missing: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN"
    );
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    refresh_token: ZOHO_REFRESH_TOKEN,
  });

  const res = await fetch(`${ZOHO_ACCOUNTS_URL}?${params.toString()}`, {
    method: "POST",
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    throw new Error(
      `Zoho token refresh failed (${res.status}): ${JSON.stringify(data)}`
    );
  }

  cachedToken = data.access_token;
  const expiresIn = data.expires_in ?? 3600;
  tokenExpiresAt = now + (expiresIn - 300) * 1000; // refresh 5 min before expiry

  return cachedToken;
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/zoho/token
 * Returns a valid Zoho access_token using the server-side refresh_token.
 * Body: (empty — credentials come from .env)
 */
app.post("/api/zoho/token", async (_req, res) => {
  try {
    const accessToken = await fetchAccessToken();
    res.json({ access_token: accessToken });
  } catch (err) {
    console.error("[/api/zoho/token]", err.message);
    res.status(502).json({ error: err.message });
  }
});

/**
 * POST /api/zoho/invoices
 * Creates an invoice in Zoho Books.
 * Body: ZohoInvoicePayload (customer_id, date, due_date, line_items, ...)
 */
app.post("/api/zoho/invoices", async (req, res) => {
  try {
    if (!ZOHO_ORGANIZATION_ID) {
      return res
        .status(500)
        .json({ error: "ZOHO_ORGANIZATION_ID is not configured" });
    }

    const accessToken = await fetchAccessToken();

    const zohoRes = await fetch(
      `${ZOHO_API_BASE}/invoices?organization_id=${ZOHO_ORGANIZATION_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          "Content-Type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify(req.body),
      }
    );

    const data = await zohoRes.json();

    if (!zohoRes.ok) {
      console.error("[/api/zoho/invoices] Zoho error", zohoRes.status, data);
      return res.status(zohoRes.status).json(data);
    }

    if (data.code !== 0) {
      console.error("[/api/zoho/invoices] Zoho Books error", data);
      return res.status(422).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error("[/api/zoho/invoices]", err.message);
    res.status(502).json({ error: err.message });
  }
});

// ── Health check ──────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
