import type { BillingInvoice } from "../types/billing";
import { billingInvoiceTemplate } from "../data/billingInvoiceTemplate";
import { TransactionService } from "./transactionService";
import { TerminalService } from "./terminalService";

export class BillingService {
  static async generateInvoice(): Promise<BillingInvoice> {
    const invoice: BillingInvoice = JSON.parse(JSON.stringify(billingInvoiceTemplate));

    const transactions = await TransactionService.getTransactions();
    const terminalsResponse = await TerminalService.list();
    const terminals = terminalsResponse.items;

    const txCount = transactions.length;
    const terminalCount = terminals.length;

    const terminalsByLocationMap: Record<string, number> = {};

    terminals.forEach((terminal) => {
      const location = terminal.location || "Unknown";
      terminalsByLocationMap[location] = (terminalsByLocationMap[location] || 0) + 1;
    });

    const terminalsByLocation = Object.entries(terminalsByLocationMap).map(
      ([location, count]) => ({
        location,
        count
      })
    );

    invoice.customer = {
      customer_id: "CUST-001",
      name: "Hotel Example",
      email: "hotel@test.com",
      address: "Brussels",
      status: "active"
    };

    invoice.billing_configuration = {
      start_payment_date: "2026-03-01",
      reference_date_logic: "installation_date",
      billing_cycle_days: 30
    };

    invoice.source_data = {
      tx_count: txCount,
      terminal_count: terminalCount,
      terminals_by_location: terminalsByLocation
    };

    invoice.pricing = {
      fixed_fee: 100,
      price_per_tx: 0.02,
      price_per_terminal: 10,
      tax_rate: 0.21,
      discount: 0
    };

    const txAmount = invoice.source_data.tx_count * invoice.pricing.price_per_tx;
    const terminalAmount = invoice.source_data.terminal_count * invoice.pricing.price_per_terminal;

    invoice.invoice_lines = [
      {
        description: "Fixed Fee",
        quantity: 1,
        unit_price: invoice.pricing.fixed_fee,
        amount: invoice.pricing.fixed_fee
      },
      {
        description: "Transaction Fees",
        quantity: invoice.source_data.tx_count,
        unit_price: invoice.pricing.price_per_tx,
        amount: txAmount
      },
      {
        description: "Terminal Fees",
        quantity: invoice.source_data.terminal_count,
        unit_price: invoice.pricing.price_per_terminal,
        amount: terminalAmount
      }
    ];

    const subtotal = invoice.invoice_lines.reduce((sum, line) => sum + line.amount, 0);
    const tax = subtotal * invoice.pricing.tax_rate;

    invoice.totals = {
      subtotal,
      tax_total: tax,
      grand_total: subtotal + tax
    };

    return invoice;
  }
}