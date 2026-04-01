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
  }): Promise<BillingInvoice> {
    const invoice: BillingInvoice = JSON.parse(JSON.stringify(billingInvoiceTemplate));

    // 1. Récupérer toutes les données
    const transactions = await TransactionService.getTransactions();
    const terminalsResponse = await TerminalService.list();
    const allTerminals = terminalsResponse.items;

    // 2. Filtrer les terminaux du client uniquement
    const customerTerminals = allTerminals.filter(
      (t) => t.customer_id === customerData.id
    );

    // 3. IDs des terminaux du client (en string pour matcher transaction.terminal)
    const customerTerminalIds = customerTerminals.map((t) => String(t.id));

    // 4. Compter les terminaux et les regrouper par location (du client uniquement)
    const terminalCount = customerTerminals.length;

    const terminalsByLocationMap: Record<string, number> = {};
    customerTerminals.forEach((terminal) => {
      const location = terminal.location || "Unknown";
      terminalsByLocationMap[location] = (terminalsByLocationMap[location] || 0) + 1;
    });

    const terminalsByLocation = Object.entries(terminalsByLocationMap).map(
      ([location, count]) => ({ location, count })
    );

    // 5. Infos client
    invoice.customer = {
      customer_id: String(customerData.id),
      name: customerData.name,
      email: customerData.email,
      address: customerData.address || "",
      status: customerData.status,
    };

    // 6. Configuration de facturation
    invoice.billing_configuration = {
      start_payment_date: "2026-03-01",
      reference_date_logic: "installation_date",
      billing_cycle_days: 30,
    };

    // 7. Calcul de la période
    const billingPeriod = this.calculateBillingPeriod(
      invoice.billing_configuration.start_payment_date,
      invoice.billing_configuration.billing_cycle_days
    );
    invoice.billing_period = billingPeriod;

    // 8. Filtrer les transactions : client + période
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

    // 9. Source data
    invoice.source_data = {
      tx_count: txCount,
      terminal_count: terminalCount,
      terminals_by_location: terminalsByLocation,
    };

    // 10. Pricing
    invoice.pricing = {
      fixed_fee: 100,
      included_tx_count: 1000,
      extra_tx_unit_price: 0.02,
      price_per_terminal: 10,
      tax_rate: 0.21,
      discount: 0,
    };

    // 11. Calcul des lignes de facture
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

    // 12. Totaux
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

  // Calcul de la période de facturation
  static calculateBillingPeriod(startPaymentDate: string, billingCycleDays: number = 30) {
    const start = new Date(startPaymentDate);

    const periodStart = new Date(start);
    const periodEnd = new Date(start);
    periodEnd.setDate(periodEnd.getDate() + billingCycleDays - 1); // jour de départ inclus

    const invoiceDate = new Date(periodEnd);
    invoiceDate.setDate(invoiceDate.getDate() + 1); // jour suivant la fin de période

    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 15); // échéance = 15 jours après facture

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    return {
      period_start: formatDate(periodStart),
      period_end: formatDate(periodEnd),
      invoice_date: formatDate(invoiceDate),
      due_date: formatDate(dueDate),
    };
  }
}