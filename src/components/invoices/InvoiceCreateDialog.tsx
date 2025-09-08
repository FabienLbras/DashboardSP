import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Plus, Trash2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useToast } from "../../hooks/useToast";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceCreateDialog({ open, onOpenChange }: InvoiceCreateDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Invoice data
  const [invoiceData, setInvoiceData] = useState({
    customer: "",
    customerEmail: "",
    customerAddress: "",
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: "",
    notes: "",
    terms: "Payment due within 30 days"
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "", quantity: 1, rate: 0, amount: 0 }
  ]);

  const customers = [
    { name: "Hotel Guest Services", email: "billing@hotelguest.com" },
    { name: "Conference Center", email: "accounts@confcenter.com" },
    { name: "Catering Services", email: "payments@catering.com" },
    { name: "Corporate Events", email: "billing@corporate.com" }
  ];

  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updated.amount = updated.quantity * updated.rate;
        }
        return updated;
      }
      return item;
    }));
  };

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const tax = total * 0.1; // 10% tax
  const finalTotal = total + tax;

  const handleCustomerSelect = (customerName: string) => {
    const customer = customers.find(c => c.name === customerName);
    if (customer) {
      setInvoiceData({
        ...invoiceData,
        customer: customer.name,
        customerEmail: customer.email
      });
    }
  };

  const handleSave = async (asDraft = false) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: asDraft ? "Draft Saved" : "Invoice Created",
      description: asDraft 
        ? "Invoice has been saved as draft" 
        : "Invoice has been created successfully"
    });
    
    setIsLoading(false);
    onOpenChange(false);
    
    // Reset form
    setStep(1);
    setInvoiceData({
      customer: "",
      customerEmail: "",
      customerAddress: "",
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: "",
      notes: "",
      terms: "Payment due within 30 days"
    });
    setItems([{ id: "1", description: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Create New Invoice</DialogTitle>
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                    num === step 
                      ? 'bg-primary text-primary-foreground scale-110' 
                      : num < step 
                        ? 'bg-green-500 text-white' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {num < step ? <Check className="w-4 h-4" /> : num}
                  </div>
                  {num < 3 && <div className={`w-12 h-0.5 mx-2 transition-all duration-200 ${num < step ? 'bg-green-500' : 'bg-muted'}`} />}
                </div>
              ))}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Customer Information */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer</Label>
                  <Select onValueChange={handleCustomerSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select or type customer name" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.name} value={customer.name}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Customer Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={invoiceData.customerEmail}
                    onChange={(e) => setInvoiceData({ ...invoiceData, customerEmail: e.target.value })}
                    placeholder="customer@company.com"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="customerAddress">Customer Address</Label>
                  <Textarea
                    id="customerAddress"
                    value={invoiceData.customerAddress}
                    onChange={(e) => setInvoiceData({ ...invoiceData, customerAddress: e.target.value })}
                    placeholder="Enter customer address"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Invoice Details */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold">Invoice Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    value={invoiceData.invoiceNumber}
                    onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={invoiceData.issueDate}
                    onChange={(e) => setInvoiceData({ ...invoiceData, issueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={invoiceData.dueDate}
                    onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Line Items</h4>
                  <Button onClick={addItem} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {items.map((item, index) => (
                  <Card key={item.id} className="p-4 transition-all duration-200 hover:shadow-md">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-5">
                        <Label>Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                          min="1"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Rate ($)</Label>
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value))}
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Amount</Label>
                        <div className="text-lg font-semibold p-2">${item.amount.toFixed(2)}</div>
                      </div>
                      <div className="md:col-span-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                <Card className="p-4 bg-muted/50">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (10%):</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>${finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Step 3: Review & Notes */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold">Review & Additional Information</h3>
              
              <Card className="p-4">
                <h4 className="font-medium mb-2">Invoice Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Customer:</strong> {invoiceData.customer}
                  </div>
                  <div>
                    <strong>Invoice #:</strong> {invoiceData.invoiceNumber}
                  </div>
                  <div>
                    <strong>Issue Date:</strong> {invoiceData.issueDate}
                  </div>
                  <div>
                    <strong>Due Date:</strong> {invoiceData.dueDate}
                  </div>
                  <div className="col-span-2">
                    <strong>Total Amount:</strong> 
                    <Badge variant="secondary" className="ml-2 text-lg">
                      ${finalTotal.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                  placeholder="Add any additional notes for the customer"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  value={invoiceData.terms}
                  onChange={(e) => setInvoiceData({ ...invoiceData, terms: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {step === 3 && (
                <Button
                  variant="outline"
                  onClick={() => handleSave(true)}
                  disabled={isLoading}
                >
                  Save as Draft
                </Button>
              )}
              
              {step < 3 ? (
                <Button onClick={nextStep}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={() => handleSave(false)} disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Invoice"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}