import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { Download, Send, Printer, Edit, Copy } from "lucide-react";
import { useToast } from "../../hooks/useToast";

interface InvoiceDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    number: string;
    date: string;
    dueDate: string;
    amount: number;
    status: string;
    customer: string;
  } | null;
}

export function InvoiceDetailsDialog({ open, onOpenChange, invoice }: InvoiceDetailsDialogProps) {
  const { toast } = useToast();

  if (!invoice) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDownloadPDF = () => {
    toast({
      title: "Generating PDF",
      description: "Your invoice PDF will be downloaded shortly."
    });
  };

  const handleSendReminder = () => {
    toast({
      title: "Reminder Sent",
      description: "Payment reminder has been sent to the customer."
    });
  };

  const handleDuplicateInvoice = () => {
    toast({
      title: "Invoice Duplicated",
      description: "A new invoice has been created based on this one."
    });
  };

  // Mock invoice details
  const invoiceDetails = {
    items: [
      { description: "Payment Processing Service", quantity: 1, rate: 150.00, amount: 150.00 },
      { description: "Transaction Fee", quantity: 25, rate: 2.50, amount: 62.50 },
      { description: "Monthly Service Fee", quantity: 1, rate: 89.99, amount: 89.99 }
    ],
    subtotal: 302.49,
    tax: 30.25,
    total: 332.74,
    customerDetails: {
      name: invoice.customer,
      email: "billing@customer.com",
      address: "123 Business St, Suite 100\nCity, State 12345",
      phone: "(555) 123-4567"
    },
    companyDetails: {
      name: "Your Company Name",
      address: "456 Corporate Ave\nBusiness City, State 67890",
      phone: "(555) 987-6543",
      email: "billing@yourcompany.com"
    }
  };

  const daysSinceDue = invoice.status === 'overdue' 
    ? Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Invoice Details</DialogTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(invoice.status)}
              {invoice.status === 'overdue' && (
                <Badge variant="outline" className="text-red-600">
                  {daysSinceDue} days overdue
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleDownloadPDF} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handleSendReminder} size="sm" variant="outline">
              <Send className="w-4 h-4 mr-2" />
              Send Reminder
            </Button>
            <Button size="sm" variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button size="sm" variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button onClick={handleDuplicateInvoice} size="sm" variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </Button>
          </div>
        </DialogHeader>

        {/* Invoice Preview */}
        <Card className="border-2 shadow-lg animate-fade-in">
          <CardContent className="p-8 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-primary">INVOICE</h1>
                <p className="text-lg text-muted-foreground mt-2">#{invoice.number}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">${invoice.amount.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">
                  Due: {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <Separator />

            {/* Company & Customer Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-3">From:</h3>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{invoiceDetails.companyDetails.name}</p>
                  <p className="whitespace-pre-line">{invoiceDetails.companyDetails.address}</p>
                  <p>{invoiceDetails.companyDetails.phone}</p>
                  <p>{invoiceDetails.companyDetails.email}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Bill To:</h3>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{invoiceDetails.customerDetails.name}</p>
                  <p className="whitespace-pre-line">{invoiceDetails.customerDetails.address}</p>
                  <p>{invoiceDetails.customerDetails.phone}</p>
                  <p>{invoiceDetails.customerDetails.email}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Invoice Date</p>
                <p>{new Date(invoice.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Due Date</p>
                <p>{new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Payment Terms</p>
                <p>Net 30</p>
              </div>
            </div>

            <Separator />

            {/* Line Items */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Items</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Description</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Rate</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceDetails.items.map((item, index) => (
                      <tr key={index} className="border-b border-muted hover:bg-muted/50 transition-colors">
                        <td className="py-3">{item.description}</td>
                        <td className="text-right py-3">{item.quantity}</td>
                        <td className="text-right py-3">${item.rate.toFixed(2)}</td>
                        <td className="text-right py-3 font-medium">${item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${invoiceDetails.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (10%):</span>
                    <span>${invoiceDetails.tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${invoiceDetails.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Payment Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Payment Information</h3>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                <p><strong>Payment Methods:</strong> Credit Card, Bank Transfer, Check</p>
                <p><strong>Account Number:</strong> 1234-5678-9012</p>
                <p><strong>Routing Number:</strong> 021000021</p>
                <p className="text-xs text-muted-foreground mt-4">
                  Payment is due within 30 days of invoice date. Late payments may be subject to fees.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground pt-4 border-t">
              <p>Thank you for your business!</p>
              <p>Questions about this invoice? Contact us at billing@yourcompany.com</p>
            </div>
          </CardContent>
        </Card>

        {/* Payment History (if paid) */}
        {invoice.status === 'paid' && (
          <Card className="animate-fade-in">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Payment History</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">Payment Received</p>
                    <p className="text-muted-foreground">Credit Card ****1234</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${invoice.amount.toFixed(2)}</p>
                    <p className="text-muted-foreground">
                      {new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}