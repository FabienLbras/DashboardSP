import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Loader2, Check, ArrowLeft, ArrowRight, FileText } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { CustomerService, Customer } from "../../services/customerService";
import { BillingService } from "../../services/billingService";
import type { BillingInvoice } from "../../types/billing";

interface InvoiceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceCreateDialog({ open, onOpenChange }: InvoiceCreateDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Customers
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Generated invoice
  const [generatedInvoice, setGeneratedInvoice] = useState<BillingInvoice | null>(null);

  // Load real customers from API
  useEffect(() => {
    if (open) {
      setLoadingCustomers(true);
      CustomerService.list()
        .then((res) => setCustomers(res.items))
        .catch(() => toast({ title: "Error", description: "Failed to load customers" }))
        .finally(() => setLoadingCustomers(false));
    }
  }, [open]);

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => String(c.id) === customerId);
    setSelectedCustomer(customer || null);
  };

  const handleGenerateInvoice = async () => {
    if (!selectedCustomer) return;
    setIsLoading(true);
    try {
      const invoice = await BillingService.generateInvoice({
        id: selectedCustomer.id,
        name: selectedCustomer.name,
        email: selectedCustomer.email,
        address: selectedCustomer.address,
        status: selectedCustomer.status,
      });
      setGeneratedInvoice(invoice);
      setStep(2);
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate invoice" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedCustomer(null);
    setGeneratedInvoice(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Generate Invoice</DialogTitle>
            {/* Step indicators */}
            <div className="flex items-center space-x-2">
              {[1, 2].map((num) => (
                <div key={num} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                    num === step
                      ? "bg-primary text-primary-foreground scale-110"
                      : num < step
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {num < step ? <Check className="w-4 h-4" /> : num}
                  </div>
                  {num < 2 && (
                    <div className={`w-12 h-0.5 mx-2 transition-all duration-200 ${num < step ? "bg-green-500" : "bg-muted"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">

          {/* Step 1 — Select Customer */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Customer</h3>

              {loadingCustomers ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading customers...
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Customer *</Label>
                  <Select onValueChange={handleCustomerSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={String(customer.id)}>
                          {customer.name} — {customer.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Customer info preview */}
              {selectedCustomer && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-1 text-sm">
                    <p><strong>Name:</strong> {selectedCustomer.name}</p>
                    <p><strong>Email:</strong> {selectedCustomer.email}</p>
                    {selectedCustomer.address && (
                      <p><strong>Address:</strong> {selectedCustomer.address}</p>
                    )}
                    <p>
                      <strong>Status:</strong>{" "}
                      <Badge className={selectedCustomer.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"}>
                        {selectedCustomer.status}
                      </Badge>
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2 — Invoice Preview */}
          {step === 2 && generatedInvoice && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Generated Invoice
              </h3>

              {/* Billing Period */}
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

              {/* Source Data */}
              <Card>
                <CardContent className="p-4 text-sm space-y-2">
                  <p className="font-semibold mb-2">Source Data</p>
                  <p><strong>Transactions:</strong> {generatedInvoice.source_data.tx_count}</p>
                  <p><strong>Terminals:</strong> {generatedInvoice.source_data.terminal_count}</p>
                  <div>
                    <strong>Terminals by location:</strong>
                    <ul className="mt-1 ml-4 list-disc">
                      {generatedInvoice.source_data.terminals_by_location.map((t) => (
                        <li key={t.location}>{t.location}: {t.count} terminal(s)</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Lines */}
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

                  {/* Totals */}
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

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button variant="outline" onClick={step === 1 ? handleClose : () => setStep(1)} >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === 1 ? "Cancel" : "Back"}
            </Button>

            {step === 1 && (
              <Button
                onClick={handleGenerateInvoice}
                disabled={!selectedCustomer || isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><ArrowRight className="w-4 h-4 mr-2" />Generate Invoice</>
                )}
              </Button>
            )}

            {step === 2 && (
              <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700 text-white">
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