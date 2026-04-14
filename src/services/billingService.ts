import type { BillingInvoice } from "../types/billing";
import { billingInvoiceTemplate } from "../data/billingInvoiceTemplate";
import { TransactionService } from "./transactionService";
import { TerminalService } from "./terminalService";

export class BillingService {
  static async generateInvoice(customerData: {
    id: number;
    name: string;
    email: string;
    address?: string;
    status: string;
    fixed_fee?: number | null;
    included_tx_count?: number | null;
    extra_tx_unit_price?: number | null;
    price_per_terminal?: number | null;
    tax_rate?: number | null;
  }, options?: {
    start_date?: string; // ex: "2026-03-01"
    end_date?: string;   // ex: "2026-03-31"
  }): Promise<BillingInvoice> {
    const invoice: BillingInvoice = JSON.parse(JSON.stringify(billingInvoiceTemplate));

    const transactions = await TransactionService.getTransactions();
    const terminalsResponse = await TerminalService.list();
    const allTerminals = terminalsResponse.items;

    const customerTerminals = allTerminals.filter(
      (t) => t.customer_id === customerData.id
    );
    const customerTerminalIds = customerTerminals.map((t) => String(t.serial_number));
    const terminalCount = customerTerminals.length;

    const terminalsByLocationMap: Record<string, number> = {};
    customerTerminals.forEach((terminal) => {
      const location = terminal.location || "Unknown";
      terminalsByLocationMap[location] = (terminalsByLocationMap[location] || 0) + 1;
    });
    const terminalsByLocation = Object.entries(terminalsByLocationMap).map(
      ([location, count]) => ({ location, count })
    );

    invoice.customer = {
      customer_id: String(customerData.id),
      name: customerData.name,
      email: customerData.email,
      address: customerData.address || "",
      status: customerData.status,
    };

    // Utiliser les dates passées en paramètre OU calculer automatiquement
    const startDate = options?.start_date || new Date().toISOString().split("T")[0];
    
    invoice.billing_configuration = {
      start_payment_date: startDate,
      reference_date_logic: "installation_date",
      billing_cycle_days: 30,
    };

    // Si une date de fin est fournie, on l'utilise directement
    let billingPeriod;
    if (options?.start_date && options?.end_date) {
      const invoiceDate = new Date(options.end_date);
      invoiceDate.setDate(invoiceDate.getDate() + 1);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 15);
      const fmt = (d: Date) => d.toISOString().split("T")[0];
      billingPeriod = {
        period_start: options.start_date,
        period_end: options.end_date,
        invoice_date: fmt(invoiceDate),
        due_date: fmt(dueDate),
      };
    } else {
      billingPeriod = this.calculateBillingPeriod(startDate, 30);
    }

    invoice.billing_period = billingPeriod;

    const periodStart = new Date(invoice.billing_period.period_start);
    const periodEnd = new Date(invoice.billing_period.period_end);
    periodEnd.setHours(23, 59, 59, 999);

    const filteredTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.createdOn);
      const isInPeriod = transactionDate >= periodStart && transactionDate <= periodEnd;
      const isFromCustomer = customerTerminalIds.includes(transaction.terminal);
      return isInPeriod && isFromCustomer;
    });

    const txCount = filteredTransactions.length;

    invoice.source_data = {
      tx_count: txCount,
      terminal_count: terminalCount,
      terminals_by_location: terminalsByLocation,
    };

    invoice.pricing = {
      fixed_fee: Number(customerData.fixed_fee ?? 100),
      included_tx_count: Number(customerData.included_tx_count ?? 1000),
      extra_tx_unit_price: Number(customerData.extra_tx_unit_price ?? 0.02),
      price_per_terminal: Number(customerData.price_per_terminal ?? 10),
      tax_rate: Number(customerData.tax_rate ?? 0.21),
      discount: 0,
    };

    const extraTxCount = Math.max(0, txCount - invoice.pricing.included_tx_count);
    const extraTxAmount = extraTxCount * invoice.pricing.extra_tx_unit_price;
    const terminalAmount = terminalCount * invoice.pricing.price_per_terminal;

    invoice.invoice_lines = [
      {
        description: `Fixed monthly fee including ${invoice.pricing.included_tx_count} transactions`,
        quantity: 1,
        unit_price: invoice.pricing.fixed_fee,
        amount: invoice.pricing.fixed_fee,
      },
      {
        description: "Extra transaction fees",
        quantity: extraTxCount,
        unit_price: invoice.pricing.extra_tx_unit_price,
        amount: extraTxAmount,
      },
      {
        description: "Terminal fees",
        quantity: terminalCount,
        unit_price: invoice.pricing.price_per_terminal,
        amount: terminalAmount,
      },
    ];

    const subtotal = invoice.invoice_lines.reduce((sum, line) => sum + line.amount, 0);
    const taxableAmount = subtotal - invoice.pricing.discount;
    const tax = taxableAmount * invoice.pricing.tax_rate;

    invoice.totals = {
      subtotal,
      tax_total: tax,
      grand_total: taxableAmount + tax,
    };

    return invoice;
  }

  static calculateBillingPeriod(startPaymentDate: string, billingCycleDays: number = 30) {
    const start = new Date(startPaymentDate);
    const periodStart = new Date(start);
    const periodEnd = new Date(start);
    periodEnd.setDate(periodEnd.getDate() + billingCycleDays - 1);
    const invoiceDate = new Date(periodEnd);
    invoiceDate.setDate(invoiceDate.getDate() + 1);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 15);
    const formatDate = (date: Date) => date.toISOString().split("T")[0];
    return {
      period_start: formatDate(periodStart),
      period_end: formatDate(periodEnd),
      invoice_date: formatDate(invoiceDate),
      due_date: formatDate(dueDate),
    };
  }
}
