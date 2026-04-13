import type { BillingInvoice } from "../types/billing";

const ZOHO_API_BASE = "https://www.zohoapis.eu/books/v3";
const ACCESS_TOKEN = import.meta.env.VITE_ZOHO_ACCESS_TOKEN as string;
const ORGANIZATION_ID = import.meta.env.VITE_ZOHO_ORGANIZATION_ID as string;

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

export async function createZohoInvoice(
  invoice: BillingInvoice,
  customerZohoId: string
): Promise<ZohoInvoiceResponse> {
  if (!ACCESS_TOKEN) {
    throw new Error("VITE_ZOHO_ACCESS_TOKEN is not configured");
  }
  if (!ORGANIZATION_ID) {
    throw new Error("VITE_ZOHO_ORGANIZATION_ID is not configured");
  }

  const payload = mapToZohoPayload(invoice, customerZohoId);

  const response = await fetch(
    `${ZOHO_API_BASE}/invoices?organization_id=${ORGANIZATION_ID}`,
    {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${ACCESS_TOKEN}`,
        "Content-Type": "application/json;charset=UTF-8",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Zoho API error ${response.status}: ${errorText}`);
  }

  const data: ZohoInvoiceResponse = await response.json();

  if (data.code !== 0) {
    throw new Error(`Zoho Books error: ${data.message}`);
  }

  return data;
}
