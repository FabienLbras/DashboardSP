import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { 
  Download, 
  RefreshCw, 
  Copy,
  MapPin,
  Clock,
  CreditCard,
  User,
  DollarSign,
  Calendar,
  Terminal,
  Receipt,
  AlertCircle,
  Loader2
} from "lucide-react";
import { TransactionService } from "../services/transactionService";
import { Alert, AlertDescription } from "./ui/alert";
import { useToast } from "../hooks/useToast";
import type { Transaction } from "../types/transaction";

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onRefreshTransactions?: () => void;
}

export default function TransactionDetailsModal({ 
  isOpen, 
  onClose, 
  transaction,
  onRefreshTransactions 
}: TransactionDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  if (!transaction) return null;

  const handleCopyTransactionId = () => {
    navigator.clipboard.writeText(transaction.id);
    toast({
      title: "Copied!",
      description: "Transaction ID copied to clipboard",
    });
  };

  const handleDownloadReceipt = async () => {
    try {
      setLoading(true);
      setError("");
      const blob = await TransactionService.downloadReceipt(transaction.id);
      const filename = `receipt_${transaction.id}.pdf`;
      TransactionService.downloadBlob(blob, filename);
    } catch (err) {
      setError("Failed to download receipt");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async () => {
    try {
      const confirmRefund = window.confirm(
        `Are you sure you want to process a refund for transaction ${transaction.id}?`
      );
      if (!confirmRefund) return;

      setLoading(true);
      setError("");
      await TransactionService.processRefund(transaction.id);
      
      // Refresh the transactions list if callback provided
      if (onRefreshTransactions) {
        onRefreshTransactions();
      }
      
      // Close the modal
      onClose();
      toast({
        title: "Refund Processed",
        description: "Refund has been processed successfully!",
      });
    } catch (err) {
      setError("Failed to process refund");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colorClass = TransactionService.getStatusColor(status as Transaction['state']);
    return (
      <Badge className={colorClass}>
        {status?.charAt(0)?.toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Transaction Details
          </DialogTitle>
          <DialogDescription>
            Complete information for transaction {transaction.id}
          </DialogDescription>
        </DialogHeader>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Transaction Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Transaction Overview
                </span>
                {getStatusBadge(transaction.state)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Transaction ID</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm">{transaction.id}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyTransactionId}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Date & Time
                  </p>
                  <p className="text-sm">
                    {new Date(transaction.createdOn).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Location
                  </p>
                  <p className="text-sm">{transaction.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Customer Name</p>
                  <p className="text-sm">{transaction.customerName}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{transaction.description || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                  <p className="text-sm">{transaction.paymentMethod}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Fees</p>
                  <p className="text-sm">{transaction.fees ? formatCurrency(transaction.fees, transaction.currency) : 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Terminal className="h-4 w-4" />
                    Terminal
                  </p>
                  <p className="text-sm font-mono">{transaction.terminal}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Refund Amount</p>
                  <p className="text-sm">{transaction.refundAmount ? formatCurrency(transaction.refundAmount, transaction.currency) : 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(transaction.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                      </span>
                      <span className="text-sm">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={handleDownloadReceipt}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download Receipt
                </Button>
                
                {transaction.state === "completed" && (
                  <Button
                    variant="destructive"
                    onClick={handleProcessRefund}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Process Refund
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}