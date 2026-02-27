import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Send, Clock, Mail, MessageSquare } from "lucide-react";
import { useToast } from "../../hooks/useToast";

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    number: string;
    customer: string;
    amount: number;
    dueDate: string;
    status: string;
  } | null;
}

export function ReminderDialog({ open, onOpenChange, invoice }: ReminderDialogProps) {
  const { toast } = useToast();
  const [reminderType, setReminderType] = useState("gentle");
  const [customMessage, setCustomMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!invoice) return null;

  const reminderTemplates = {
    gentle: {
      subject: "Friendly Payment Reminder",
      message: `Dear ${invoice.customer},

We hope this message finds you well. This is a gentle reminder that invoice #${invoice.number} for $${Number(invoice.amount).toFixed(2)} was due on ${new Date(invoice.dueDate).toLocaleDateString()}.

We understand that oversights happen, and we're here to make the payment process as smooth as possible for you.

If you have any questions about this invoice or need to discuss payment arrangements, please don't hesitate to reach out to us.

Thank you for your continued business!

Best regards,
Accounts Receivable Team`
    },
    formal: {
      subject: "Payment Reminder - Invoice Overdue",
      message: `Dear ${invoice.customer},

This is to remind you that payment for invoice #${invoice.number} in the amount of $${Number(invoice.amount).toFixed(2)} was due on ${new Date(invoice.dueDate).toLocaleDateString()} and remains outstanding.

Please arrange for payment at your earliest convenience. If payment has already been made, please disregard this notice and accept our thanks.

For any inquiries regarding this invoice, please contact our accounts department.

Sincerely,
Accounts Receivable Department`
    },
    urgent: {
      subject: "URGENT: Overdue Payment Notice",
      message: `Dear ${invoice.customer},

URGENT NOTICE: Invoice #${invoice.number} for $${Number(invoice.amount).toFixed(2)} is now significantly overdue. The original due date was ${new Date(invoice.dueDate).toLocaleDateString()}.

Immediate payment is required to avoid any disruption to services and potential late fees.

Please contact us immediately to resolve this matter or to discuss payment arrangements.

Time-sensitive - Please respond within 24 hours.

Accounts Receivable Team`
    }
  };

  const currentTemplate = reminderTemplates[reminderType as keyof typeof reminderTemplates];

  const handleSendReminder = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Reminder Sent Successfully",
      description: `Payment reminder has been sent to ${invoice.customer}`,
    });
    
    setIsLoading(false);
    onOpenChange(false);
  };

  const daysPastDue = Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Send className="w-6 h-6" />
            Send Payment Reminder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Summary */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Invoice</p>
                  <p className="font-semibold">#{invoice.number}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Customer</p>
                  <p className="font-semibold">{invoice.customer}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Amount</p>
                  <p className="font-semibold">${Number(invoice.amount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Days Overdue</p>
                  <Badge variant="destructive" className="w-fit">
                    <Clock className="w-3 h-3 mr-1" />
                    {daysPastDue} days
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reminder Type Selection */}
          <div className="space-y-4">
            <Label htmlFor="reminderType">Reminder Tone</Label>
            <Select value={reminderType} onValueChange={setReminderType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gentle">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    Gentle Reminder - Friendly and understanding tone
                  </div>
                </SelectItem>
                <SelectItem value="formal">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    Formal Reminder - Professional business tone
                  </div>
                </SelectItem>
                <SelectItem value="urgent">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    Urgent Notice - Direct and immediate action required
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message Preview */}
          <div className="space-y-4">
            <Label>Message Preview</Label>
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Subject: {currentTemplate.subject}</span>
                </div>
                <div className="bg-background p-4 rounded border">
                  <pre className="whitespace-pre-wrap text-sm font-sans">
                    {customMessage || currentTemplate.message}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="customMessage">
              Custom Message (Optional)
              <span className="text-sm text-muted-foreground ml-2">
                Leave empty to use template above
              </span>
            </Label>
            <Textarea
              id="customMessage"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Type your custom message here..."
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          {/* Delivery Options */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Delivery Options
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Email notification</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Activity log entry</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Follow-up scheduling</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>PDF invoice attachment</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline">
                Preview Email
              </Button>
              <Button onClick={handleSendReminder} disabled={isLoading}>
                {isLoading ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Reminder
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}