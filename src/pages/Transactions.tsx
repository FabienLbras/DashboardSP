

import { useUser } from "../context/UserContext";
import { checkPermission } from "../auth/checkPermission";
import { PERMISSIONS } from "../auth/permissions";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../components/ui/table";
import {
  RefreshCw,
  AlertCircle,
  Loader2
} from "lucide-react";

import { Alert, AlertDescription } from "../components/ui/alert";
import { TransactionService } from "../services/transactionService";
import TransactionDetailsModal from "../components/TransactionDetailsModal";
import type { Transaction } from "../types/transaction";
import useTransactions from "../hooks/useTransactions";
import { useToast } from "../hooks/useToast";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Header from "../components/transactions/Header";
import TransactionFilters from "../components/transactions/TransactionFilters";
import TransactionActions from "../components/transactions/TransactionActions";



export default function Transactions() {
  const user = useUser();
  if (!user || !checkPermission(user.role, PERMISSIONS.VIEW_TRANSACTIONS)) {
  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-semibold">Access Denied</h2>
      <p>You do not have permission to view this page.</p>
    </div>
        );
    } 
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [terminalFilter, setTerminalFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { fetchTransactions, transactions, loading } = useTransactions();
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Helper function to filter transactions based on current filters
  const getFilteredTransactions = () => {
    let filteredTransactions = [...transactions];
    
    // Apply status filter
    if (statusFilter !== "all") {
      filteredTransactions = filteredTransactions.filter(t => t.state === statusFilter);
    }
    
    // Apply terminal filter
    if (terminalFilter !== "all") {
      filteredTransactions = filteredTransactions.filter(t => t.terminal === terminalFilter);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      filteredTransactions = filteredTransactions.filter(t => 
        (t?.id && typeof t.id === 'string' && t.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t?.customerName && typeof t.customerName === 'string' && t.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filteredTransactions = filteredTransactions.filter(t => {
        const transactionDate = new Date(t.createdOn);
        
        switch (dateFilter) {
          case "today":
            return transactionDate >= today;
          case "yesterday":
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return transactionDate >= yesterday && transactionDate < today;
          case "week":
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return transactionDate >= weekAgo;
          case "month":
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return transactionDate >= monthAgo;
          case "quarter":
            const quarterAgo = new Date(today);
            quarterAgo.setMonth(quarterAgo.getMonth() - 3);
            return transactionDate >= quarterAgo;
          default:
            return true;
        }
      });
    }
    
    return filteredTransactions;
  };

  const getDisplayTransactions = () => {
    let filteredTransactions = [...transactions];
    
    // Apply status filter
    if (statusFilter !== "all") {
      filteredTransactions = filteredTransactions.filter(t => t.state === statusFilter);
    }
    
    // Apply terminal filter
    if (terminalFilter !== "all") {
      filteredTransactions = filteredTransactions.filter(t => t.terminal === terminalFilter);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      filteredTransactions = filteredTransactions.filter(t => 
        (t?.id && typeof t.id === 'string' && t.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t?.customerName && typeof t.customerName === 'string' && t.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filteredTransactions = filteredTransactions.filter(t => {
        const transactionDate = new Date(t.createdOn);
        
        switch (dateFilter) {
          case "today":
            return transactionDate >= today;
          case "yesterday":
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return transactionDate >= yesterday && transactionDate < today;
          case "week":
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return transactionDate >= weekAgo;
          case "month":
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return transactionDate >= monthAgo;
          case "quarter":
            const quarterAgo = new Date(today);
            quarterAgo.setMonth(quarterAgo.getMonth() - 3);
            return transactionDate >= quarterAgo;
          default:
            return true;
        }
      });
    }
    
    return filteredTransactions;
  };

  // Handle refresh statusFilter, terminalFilter, dateFilter
  const handleRefresh = () => {
    fetchTransactions();
  };

  // Handle CSV export
  const handleExportCSV = async () => {
    try {
      setError("");
      
      // Get filtered transactions
      const filteredTransactions = getFilteredTransactions();
      
      if (filteredTransactions.length === 0) {
        setError("No transactions to export based on current filters");
        return;
      }
      
      // Create CSV content
      const csvHeaders = [
        'Transaction ID',
        'Date & Time',
        'Customer Name',
        'Amount',
        'Currency',
        'Location',
        'Status',
        'Terminal',
        'Payment Method',
        'Description',
        'Fees',
        'Refund Amount'
      ];
      
      const csvRows = filteredTransactions.map(transaction => [
        transaction.id,
        new Date(transaction.createdOn).toLocaleString(),
        transaction.customerName,
        Number(transaction.amount).toFixed(2),
        transaction.currency || 'USD',
        transaction.location,
        transaction.state,
        transaction.terminal,
        transaction.paymentMethod,
        transaction.description || '',
        transaction.fees ? Number(transaction.fees).toFixed(2) : '0.00',
        transaction.refundAmount ? Number(transaction.refundAmount).toFixed(2) : '0.00'
      ]);
      
      // Combine headers and rows
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const filename = `transactions_${new Date().toISOString().split('T')[0]}_${filteredTransactions.length}records.csv`;
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show success toast
      toast({
        title: "Export Successful",
        description: `Successfully exported ${filteredTransactions.length} transactions to ${filename}`,
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to export CSV";
      setError("Failed to export CSV: " + errorMessage);
      console.error("CSV Export Error:", err);
    }
  };

  // Handle PDF export
  const handleExportPDF = async () => {
    try {
      setError("");
      
      // Get filtered transactions
      const filteredTransactions = getFilteredTransactions();
      
      if (filteredTransactions.length === 0) {
        setError("No transactions to export based on current filters");
        return;
      }
      
      // Create new PDF document
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // Add title and header information
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Transaction Report', 14, 20);
      
      // Add date and filter information
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const currentDate = new Date().toLocaleDateString();
      doc.text(`Generated on: ${currentDate}`, 14, 30);
      doc.text(`Total Records: ${filteredTransactions.length}`, 14, 35);
      
      // Add applied filters info
      let filterInfo = [];
      if (statusFilter !== "all") filterInfo.push(`Status: ${statusFilter}`);
      if (terminalFilter !== "all") filterInfo.push(`Terminal: ${terminalFilter}`);
      if (dateFilter !== "all") filterInfo.push(`Date Range: ${dateFilter}`);
      if (searchTerm.trim()) filterInfo.push(`Search: ${searchTerm}`);
      
      if (filterInfo.length > 0) {
        doc.text(`Filters Applied: ${filterInfo.join(', ')}`, 14, 40);
      }
      
      // Calculate totals
      const totalAmount = filteredTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const successAmount = filteredTransactions
        .filter(t => t.state === "completed" || t.state === "FULFILL")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const failedAmount = filteredTransactions
        .filter(t => t.state === "failed")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const totalFees = filteredTransactions.reduce((sum, t) => sum + (t.fees || 0), 0);
      const totalRefunds = filteredTransactions.reduce((sum, t) => sum + (t.refundAmount || 0), 0);
      
      // Add summary information
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary:', 14, 55);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 14, 62);
      doc.text(`Successful: $${successAmount.toFixed(2)}`, 80, 62);
      doc.text(`Failed: $${failedAmount.toFixed(2)}`, 150, 62);
      doc.text(`Total Fees: $${totalFees.toFixed(2)}`, 14, 69);
      doc.text(`Total Refunds: $${totalRefunds.toFixed(2)}`, 80, 69);
      
      // Prepare table data
      const tableHeaders = [
        'Transaction ID',
        'Date & Time',
        'Customer',
        'Amount',
        'Currency',
        'Location',
        'Status',
      ];
      
      const tableRows = filteredTransactions.map(transaction => [
        transaction.id,
        new Date(transaction.createdOn).toLocaleDateString() + ' ' + 
        new Date(transaction.createdOn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        transaction.customerName,
        `$${Number(transaction.amount).toFixed(2)}`,
        transaction.currency || 'USD',
        transaction.location,
        transaction.state.toUpperCase(),
      ]);
      
      // Generate table using autoTable
      autoTable(doc, {
        head: [tableHeaders],
        body: tableRows,
        startY: 80,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240],
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Transaction ID
          1: { cellWidth: 30 }, // Date & Time
          2: { cellWidth: 25 }, // Customer
          3: { cellWidth: 20 }, // Amount
          4: { cellWidth: 15 }, // Currency
          5: { cellWidth: 30 }, // Location
          6: { cellWidth: 20 }, // Status
          7: { cellWidth: 20 }, // Terminal
          8: { cellWidth: 25 }, // Payment Method
        },
        margin: { left: 14, right: 14 },
        theme: 'striped',
        showHead: 'everyPage',
      });
      
      // Add footer to each page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
        doc.text('Success Payment Dashboard - Transaction Report', 
          doc.internal.pageSize.width - 80, doc.internal.pageSize.height - 10);
      }
      
      // Save the PDF
      const filename = `transactions_report_${new Date().toISOString().split('T')[0]}_${filteredTransactions.length}records.pdf`;
      doc.save(filename);
      
      // Show success toast
      toast({
        title: "PDF Export Successful",
        description: `Successfully exported ${filteredTransactions.length} transactions to ${filename}`,
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to export PDF";
      setError("Failed to export PDF: " + errorMessage);
      console.error("PDF Export Error:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    const colorClass = TransactionService.getStatusColor(status as Transaction['state']);
    return <Badge className={colorClass}>{status?.charAt(0)?.toUpperCase() + status.slice(1)}</Badge>;
  };

  // Get filtered transactions for display
  const displayTransactions = getDisplayTransactions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Header
        handleRefresh={handleRefresh}
        handleExportCSV={handleExportCSV}
        handleExportPDF={handleExportPDF}
        loading={loading}
        displayTransactions={displayTransactions}
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <TransactionFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        terminalFilter={terminalFilter}
        setTerminalFilter={setTerminalFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        loading={loading}
      />

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction List</CardTitle>
              <CardDescription>
                {loading ? "Loading transactions..." : 
                  displayTransactions.length === transactions.length 
                    ? `${transactions.length} transactions found`
                    : `${displayTransactions.length} of ${transactions.length} transactions (filtered)`
                }
              </CardDescription>
            </div>
            {!loading && displayTransactions.length > 0 && (
              <Badge variant="outline">
                Total: ${displayTransactions.filter(t => t.state === "FULFILL").reduce((sum, t) => sum + Number(t.amount), 0).toFixed(2)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span className="text-muted-foreground">Loading transactions...</span>
            </div>
          ) : displayTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {transactions.length === 0 ? "No transactions found" : "No transactions match your filters"}
              </p>
              {transactions.length === 0 ? (
                <Button variant="outline" className="mt-4" 
                  onClick={handleRefresh}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              ) : (
                <Button variant="outline" className="mt-4" 
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setTerminalFilter("all");
                    setDateFilter("all");
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayTransactions.map((transaction) => (
                    <TableRow key={transaction?.id}>
                      <TableCell className="font-medium">{transaction?.id}</TableCell>
                      <TableCell>
                        {new Date(transaction?.createdOn).toLocaleString()}
                      </TableCell>
                      <TableCell>{transaction?.customerName}</TableCell>
                      <TableCell className="font-medium">
                        {Number(transaction?.amount).toFixed(2)} {transaction?.currency || 'USD'}
                      </TableCell>
                      <TableCell>{transaction?.location}</TableCell>
                      <TableCell>{getStatusBadge(transaction?.state)}</TableCell>
                      <TableCell>
                        <TransactionActions
                          transaction={transaction}
                          fetchTransactions={fetchTransactions}
                          setSelectedTransaction={setSelectedTransaction}
                          setIsDetailsModalOpen={setIsDetailsModalOpen}
                          transactions={transactions}
                          setError={setError}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        onRefreshTransactions={() => {
          fetchTransactions();
          setError("");
        }}
      />
    </div>
  );
}