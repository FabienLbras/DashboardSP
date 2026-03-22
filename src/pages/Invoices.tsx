import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Plus,
  Download,
  Search,
  MoreHorizontal,
  Eye,
  FileText,
  Send,
  ExternalLink,
  TrendingUp,
  Clock,
  DollarSign,
  AlertTriangle
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { InvoiceCreateDialog } from "../components/invoices/InvoiceCreateDialog";
import { InvoiceDetailsDialog } from "../components/invoices/InvoiceDetailsDialog";
import { ReminderDialog } from "../components/invoices/ReminderDialog";
import { useToast } from "../hooks/useToast";
import { useLanguage } from "../context/LanguageContext";

const invoices: any[] = [];

export default function Invoices() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 transition-colors">{t("paid")}</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors">{t("pending")}</Badge>;
      case "overdue":
        return <Badge variant="destructive" className="hover:bg-destructive/90 transition-colors">{t("overdue")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setDetailsDialogOpen(true);
  };

  const handleSendReminder = (invoice: any) => {
    setSelectedInvoice(invoice);
    setReminderDialogOpen(true);
  };

  const handleDownloadPDF = (invoice: any) => {
    toast({
      title: t("generatingPdf"),
      description: `Invoice #${invoice.number} PDF will be downloaded shortly.`,
    });
  };

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidAmount = filteredInvoices.filter(inv => inv.status === "paid").reduce((sum, invoice) => sum + invoice.amount, 0);
  const pendingAmount = filteredInvoices.filter(inv => inv.status === "pending").reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueAmount = filteredInvoices.filter(inv => inv.status === "overdue").reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{t("invoiceManagement")}</h1>
          <p className="text-muted-foreground">{t("createManageInvoices")}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setCreateDialogOpen(true)} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 hover:scale-105 transition-transform">
            <Plus className="h-4 w-4 mr-2" />
            {t("createInvoice")}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              {t("totalInvoiced")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {filteredInvoices.length} invoices
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("paidAmount")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${paidAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {filteredInvoices.filter(inv => inv.status === "paid").length} paid invoices
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t("pendingAmount")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">${pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {filteredInvoices.filter(inv => inv.status === "pending").length} pending invoices
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              {t("overdueAmount")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${overdueAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredInvoices.filter(inv => inv.status === "overdue").length} overdue invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("filter")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("searchInvoice")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatusesInv")}</SelectItem>
                <SelectItem value="paid">{t("paid")}</SelectItem>
                <SelectItem value="pending">{t("pending")}</SelectItem>
                <SelectItem value="overdue">{t("overdue")}</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("dateRange")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">{t("today")}</SelectItem>
                <SelectItem value="week">{t("thisWeek")}</SelectItem>
                <SelectItem value="month">{t("thisMonth")}</SelectItem>
                <SelectItem value="quarter">{t("thisQuarter")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("invoiceList")}</CardTitle>
          <CardDescription>
            {filteredInvoices.length} {t("invoicesFound")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoiceNum")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("dueDate")}</TableHead>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{t("amount")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>
                    {new Date(invoice.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{invoice.customer}</TableCell>
                  <TableCell className="font-medium">
                    ${Number(invoice.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                          <Eye className="h-4 w-4 mr-2" />
                          {t("viewDetails")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                          <FileText className="h-4 w-4 mr-2" />
                          {t("downloadPdf")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendReminder(invoice)}>
                          <Send className="h-4 w-4 mr-2" />
                          {t("sendReminder")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <InvoiceCreateDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
      />
      
      <InvoiceDetailsDialog 
        open={detailsDialogOpen} 
        onOpenChange={setDetailsDialogOpen}
        invoice={selectedInvoice}
      />
      
      <ReminderDialog 
        open={reminderDialogOpen} 
        onOpenChange={setReminderDialogOpen}
        invoice={selectedInvoice}
      />
      
    </div>
  );
}