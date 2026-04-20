import type { BillingInvoice } from "../types/billing";
import AuthService from "./authService";

// In dev, Vite proxies /api → http://localhost:4000
// In prod, set VITE_API_URL to your deployed backend URL
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export interface ZohoLineItem {
  name: string;
  description?: string;
  quantity: number;
  rate: number;
}

export interface ZohoInvoicePayload {
  customer_id: string;
  invoice_number?: string;
  date: string;
  due_date: string;
  line_items: ZohoLineItem[];
}

export interface ZohoInvoiceResponse {
  code: number;
  message: string;
  invoice?: {
    invoice_id: string;
    invoice_number: string;
    status: string;
    total: number;
  };
}

function mapToZohoPayload(
  invoice: BillingInvoice,
  customerZohoId: string
): ZohoInvoicePayload {
  const lineItems: ZohoLineItem[] = (invoice.invoice_lines ?? [])
    .filter((line) => (line.amount ?? 0) > 0)
    .map((line) => ({
      name: line.description,
      quantity: line.quantity === 0 ? 1 : line.quantity,
      rate: line.quantity === 0 ? line.amount : line.unit_price,
    }));

  return {
    customer_id: customerZohoId,
    invoice_number: (invoice as any).invoice_number,
    date: invoice.billing_period.invoice_date,
    due_date: invoice.billing_period.due_date,
    line_items: lineItems,
  };
}

export async function ensureZohoContact(
  customerId: number,
  name: string,
  email: string,
  phone?: string | null,
  address?: string | null
): Promise<string> {
  const response = await fetch(`${API_BASE}/api/zoho/contacts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AuthService.getAccessToken() ?? ""}`,
    },
    body: JSON.stringify({ customerId, name, email, phone, address }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Zoho contact creation failed ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.zoho_contact_id as string;
}

export async function createZohoInvoice(
  invoice: BillingInvoice,
  customerZohoId: string
): Promise<ZohoInvoiceResponse> {
  const payload = mapToZohoPayload(invoice, customerZohoId);

  const response = await fetch(`${API_BASE}/api/zoho/invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Zoho proxy error ${response.status}: ${errorText}`);
  }

  const data: ZohoInvoiceResponse = await response.json();

  if (data.code !== 0) {
    throw new Error(`Zoho Books error: ${data.message}`);
  }

  return data;
}
