import React, { useMemo, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../../components/ui/dropdown-menu";
import { Button } from '../ui/button'
import { Bug, Download, Eye, MoreHorizontal, RefreshCw } from 'lucide-react';
import TransactionService from '../../services/transactionService';
import { useToast } from "../../hooks/useToast";
import { Transaction } from "../../types/transaction";
import { useAuth } from "../../context/AuthContext";
import { APP_PERMISSIONS, hasPermission } from "../../lib/permissions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface TransactionActionsProps {
  transaction: Transaction;
  fetchTransactions: (silent?: boolean) => void;
  setSelectedTransaction: (transaction: Transaction | null) => void;
  setIsDetailsModalOpen: (open: boolean) => void;
  transactions: Transaction[];
  setError: (error: string) => void;
}

const TransactionActions = ({
    transaction,
    fetchTransactions,
    setSelectedTransaction,
    setIsDetailsModalOpen,
    transactions,
    setError
}: TransactionActionsProps) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isPayloadOpen, setIsPayloadOpen] = useState(false);
    const canUseVirtualTerminal = hasPermission(user?.role, APP_PERMISSIONS.USE_VIRTUAL_TERMINAL);
    const payloadPreview = useMemo(
      () => JSON.stringify(transaction.rawPayload ?? transaction, null, 2),
      [transaction]
    );

    // Handle view transaction details
      const handleViewDetails = async (transactionId: string) => {
        try {
          const transaction = await TransactionService.getTransactionById(transactionId);
          setSelectedTransaction(transaction);
          setIsDetailsModalOpen(true);
          setError("");
        } catch (err) {
          // Fallback to finding transaction in current list
          const foundTransaction = transactions.find((t: Transaction) => t.id === transactionId);
          if (foundTransaction) {
            setSelectedTransaction(foundTransaction);
            setIsDetailsModalOpen(true);
          }
        }
    };

    // Handle download receipt
    const handleDownloadReceipt = async (transactionId: string) => {
        try {
          const blob = await TransactionService.downloadReceipt(transactionId);
          const filename = `receipt_${transactionId}.pdf`;
          TransactionService.downloadBlob(blob, filename);
        } catch (err) {
          setError("Failed to download receipt");
        }
    };

    // Handle process refund
    const handleProcessRefund = async (transactionId: string) => {
        try {
            const confirmRefund = window.confirm("Are you sure you want to process a refund for this transaction?");
            if (confirmRefund) {
                await TransactionService.processRefund(transactionId);
                // Refresh the transactions list
                fetchTransactions(true);
                toast({
                    title: "Refund Processed",
                    description: "Refund has been processed successfully!",
                });
            }
        } catch (err) {
            setError("Failed to process refund");
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewDetails(transaction?.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsPayloadOpen(true)}>
                        <Bug className="h-4 w-4 mr-2" />
                        View Payload
                    </DropdownMenuItem>
                    <DropdownMenuItem className='hidden' onClick={() => handleDownloadReceipt(transaction?.id)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Receipt
                    </DropdownMenuItem>
                    {canUseVirtualTerminal && transaction.state === "completed" && (
                        <DropdownMenuItem onClick={() => handleProcessRefund(transaction?.id)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Process Refund
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isPayloadOpen} onOpenChange={setIsPayloadOpen}>
                <DialogContent className="max-w-4xl bg-white">
                    <DialogHeader>
                        <DialogTitle>Incoming Payload</DialogTitle>
                        <DialogDescription>
                            Raw payload received for transaction {transaction.id}
                        </DialogDescription>
                    </DialogHeader>
                    <pre className="max-h-[70vh] overflow-auto rounded-md border bg-slate-50 p-4 text-xs leading-5 text-slate-900">
{payloadPreview}
                    </pre>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default TransactionActions
