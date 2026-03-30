export interface BillingCustomer {
  customer_id: string;
  name: string;
  email: string;
  address: string;
  status: string;
}

export interface BillingConfiguration {
  start_payment_date: string;
  reference_date_logic: string;
  billing_cycle_days: number;
}

export interface BillingPeriod {
  period_start: string;
  period_end: string;
  invoice_date: string;
  due_date: string;
}

export interface TerminalsByLocation {
  location: string;
  count: number;
}

export interface SourceData {
  tx_count: number;
  terminal_count: number;
  terminals_by_location: TerminalsByLocation[];
}

export interface Pricing {
  fixed_fee: number;
  price_per_tx: number;
  price_per_terminal: number;
  tax_rate: number;
  discount: number;
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Totals {
  subtotal: number;
  tax_total: number;
  grand_total: number;
}

export interface BillingInvoice {
  customer: BillingCustomer;
  billing_configuration: BillingConfiguration;
  billing_period: BillingPeriod;
  source_data: SourceData;
  pricing: Pricing;
  invoice_lines: InvoiceLine[];
  totals: Totals;
}