
import type { BillingInvoice } from "../types/billing";

export const billingInvoiceTemplate: BillingInvoice = { 



  customer: {
    customer_id: "",
    name: "",
    email: "",
    address: "",
    status: ""
  },

  billing_configuration: {
    start_payment_date: "",
    reference_date_logic: "",
    billing_cycle_days: 30
  },

  billing_period: {
    period_start: "",
    period_end: "",
    invoice_date: "",
    due_date: ""
  },

  source_data: {
    tx_count: 0,
    terminal_count: 0,
    terminals_by_location: []
  },

    pricing: {
        fixed_fee: 0,
        included_tx_count: 0,
        extra_tx_unit_price: 0,
        price_per_terminal: 0,
        tax_rate: 0,
        discount: 0
},

  invoice_lines: [
    {
      description: "",
      quantity: 0,
      unit_price: 0,
      amount: 0
    }
  ],

  totals: {
    subtotal: 0,
    tax_total: 0,
    grand_total: 0
  }
};