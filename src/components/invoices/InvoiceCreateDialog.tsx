import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Loader2, Check, FileText } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { CustomerService, Customer } from "../../services/customerService";
import { BillingService } from "../../services/billingService";
import type { BillingInvoice } from "../../types/billing";

interface InvoiceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Calcule les dates par défaut : dernier mois complet
function getDefaultDates() {
  const now = new Date();
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return {
    start: fmt(firstDayLastMonth),
    end: fmt(lastDayLastMonth),
  };
}

export function InvoiceCreateDialog({ open, onOpenChange }: InvoiceCreateDialogProps) {
  const { toast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<BillingInvoice | null>(null);

  // Charger les clients à l'ouverture
  useEffect(() => {
    if (open) {
      setLoadingCustomers(true);
      CustomerService.list()
        .then((res) => setCustomers(res.items))
        .catch(() => toast({ title: "Error", description: "Failed to load customers" }))
        .finally(() => setLoadingCustomers(false));
    }
  }, [open]);

  //  Génération automatique dès qu'un client est sélectionné
  useEffect(() => {
    if (!selectedCustomer) return;
    handleGenerate(selectedCustomer);
  }, [selectedCustomer, startDate, endDate]);

  const handleGenerate = async (customer: Customer) => {
    setIsGenerating(true);
    setGeneratedInvoice(null);
    try {
      const invoice = await BillingService.generateInvoice(
        {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          address: customer.address,
          status: customer.status,
        },
        { start_date: startDate, end_date: endDate }
      );
      setGeneratedInvoice(invoice);
    } catch {
      toast({ title: "Error", description: "Failed to generate invoice" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setSelectedCustomer(null);
    setGeneratedInvoice(null);
    const d = getDefaultDates();
    setStartDate(d.start);
    setEndDate(d.end);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Generate Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">

          {/* Sélection client + dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-1">
              <Label>Customer *</Label>
              {loadingCustomers ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                </div>
              ) : (
                <Select onValueChange={(id) => {
                  const c = customers.find((c) => String(c.id) === id);
                  setSelectedCustomer(c || null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Loading */}
          {isGenerating && (
            <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              Generating invoice...
            </div>
          )}

          {/* Résultat */}
          {!isGenerating && generatedInvoice && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Generated Invoice
              </h3>

              {/* Période */}
              <Card>
                <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Period Start</p>
                    <p className="font-medium">{generatedInvoice.billing_period.period_start}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Period End</p>
                    <p className="font-medium">{generatedInvoice.billing_period.period_end}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Invoice Date</p>
                    <p className="font-medium">{generatedInvoice.billing_period.invoice_date}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className="font-medium">{generatedInvoice.billing_period.due_date}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Source data */}
              <Card>
                <CardContent className="p-4 text-sm space-y-1">
                  <p className="font-semibold mb-2">Source Data</p>
                  <p><strong>Transactions:</strong> {generatedInvoice.source_data.tx_count}</p>
                  <p><strong>Terminals:</strong> {generatedInvoice.source_data.terminal_count}</p>
                  <div>
                    <strong>By location:</strong>
                    <ul className="ml-4 list-disc mt-1">
                      {generatedInvoice.source_data.terminals_by_location.map((t) => (
                        <li key={t.location}>{t.location}: {t.count}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Lignes facture */}
              <Card>
                <CardContent className="p-4">
                  <p className="font-semibold mb-3">Invoice Lines</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Description</th>
                        <th className="text-right py-2">Qty</th>
                        <th className="text-right py-2">Unit Price</th>
                        <th className="text-right py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedInvoice.invoice_lines.map((line, i) => (
                        <tr key={i} className="border-b hover:bg-muted/50">
                          <td className="py-2">{line.description}</td>
                          <td className="text-right py-2">{line.quantity}</td>
                          <td className="text-right py-2">€{line.unit_price.toFixed(2)}</td>
                          <td className="text-right py-2 font-medium">€{line.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end mt-4">
                    <div className="w-64 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>€{generatedInvoice.totals.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (21%):</span>
                        <span>€{generatedInvoice.totals.tax_total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total:</span>
                        <span>€{generatedInvoice.totals.grand_total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            {generatedInvoice && (
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleClose}>
                <Check className="w-4 h-4 mr-2" />
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}