import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useCustomerFilter } from "../context/CustomerFilterContext";
import { isSuperAdmin } from "../lib/permissions";
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
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  DollarSign,
  GitMerge,
  MoreVertical,
} from "lucide-react";

type ReconciliationStatus = "matched" | "unmatched" | "pending";

interface ReconciliationRecord {
  id: string;
  date: string;
  transactionId: string;
  terminal: string;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  status: ReconciliationStatus;
  paymentMethod: string;
}

const mockReconciliation: ReconciliationRecord[] = [
  {
    id: "REC-001",
    date: "2024-01-15",
    transactionId: "TXN-1001",
    terminal: "TERM-001",
    expectedAmount: 120.50,
    actualAmount: 120.50,
    difference: 0,
    status: "matched",
    paymentMethod: "Visa",
  },
  {
    id: "REC-002",
    date: "2024-01-15",
    transactionId: "TXN-1002",
    terminal: "TERM-002",
    expectedAmount: 89.20,
    actualAmount: 90.00,
    difference: -0.80,
    status: "unmatched",
    paymentMethod: "Mastercard",
  },
  {
    id: "REC-003",
    date: "2024-01-15",
    transactionId: "TXN-1003",
    terminal: "TERM-001",
    expectedAmount: 45.75,
    actualAmount: 45.75,
    difference: 0,
    status: "matched",
    paymentMethod: "Apple Pay",
  },
  {
    id: "REC-004",
    date: "2024-01-15",
    transactionId: "TXN-1004",
    terminal: "TERM-003",
    expectedAmount: 200.00,
    actualAmount: 0,
    difference: 200.00,
    status: "unmatched",
    paymentMethod: "Visa",
  },
  {
    id: "REC-005",
    date: "2024-01-14",
    transactionId: "TXN-0998",
    terminal: "TERM-002",
    expectedAmount: 310.00,
    actualAmount: 310.00,
    difference: 0,
    status: "matched",
    paymentMethod: "Amex",
  },
  {
    id: "REC-006",
    date: "2024-01-14",
    transactionId: "TXN-0999",
    terminal: "TERM-001",
    expectedAmount: 55.00,
    actualAmount: 0,
    difference: 55.00,
    status: "pending",
    paymentMethod: "Google Pay",
  },
  {
    id: "REC-007",
    date: "2024-01-13",
    transactionId: "TXN-0950",
    terminal: "TERM-003",
    expectedAmount: 430.00,
    actualAmount: 430.00,
    difference: 0,
    status: "matched",
    paymentMethod: "Mastercard",
  },
];

export default function Reconciliation() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { selectedCustomer, setSelectedCustomer, customers } = useCustomerFilter();
  const isAdmin = isSuperAdmin(user?.role);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [terminalFilter, setTerminalFilter] = useState("all");
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) setActionsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = mockReconciliation.filter((rec) => {
    const matchesSearch =
      rec.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.terminal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || rec.status === statusFilter;
    const matchesTerminal = terminalFilter === "all" || rec.terminal === terminalFilter;

    let matchesDate = true;
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const recDate = new Date(rec.date);
      if (dateFilter === "today") {
        matchesDate = recDate >= today;
      } else if (dateFilter === "yesterday") {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        matchesDate = recDate >= yesterday && recDate < today;
      } else if (dateFilter === "week") {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDate = recDate >= weekAgo;
      } else if (dateFilter === "month") {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchesDate = recDate >= monthAgo;
      }
    }

    return matchesSearch && matchesStatus && matchesTerminal && matchesDate;
  });

  const matched = filtered.filter((r) => r.status === "matched").length;
  const unmatched = filtered.filter((r) => r.status === "unmatched").length;
  const pending = filtered.filter((r) => r.status === "pending").length;
  const totalDifference = filtered.reduce((sum, r) => sum + Math.abs(r.difference), 0);

  const terminals = Array.from(new Set(mockReconciliation.map((r) => r.terminal)));

  const getStatusBadge = (status: ReconciliationStatus) => {
    switch (status) {
      case "matched":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 gap-1">
            <CheckCircle className="h-3 w-3" />
            {t("matched")}
          </Badge>
        );
      case "unmatched":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200 gap-1">
            <XCircle className="h-3 w-3" />
            {t("unmatched")}
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 gap-1">
            <AlertCircle className="h-3 w-3" />
            {t("pending")}
          </Badge>
        );
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Date", "Transaction ID", "Terminal", "Expected", "Actual", "Difference", "Status", "Method"];
    const rows = filtered.map((r) => [
      r.id,
      r.date,
      r.transactionId,
      r.terminal,
      r.expectedAmount.toFixed(2),
      r.actualAmount.toFixed(2),
      r.difference.toFixed(2),
      r.status,
      r.paymentMethod,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reconciliation_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary flex items-center gap-2">
            <GitMerge className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
            {t("reconciliation")}
          </h1>
          <p className="text-muted-foreground text-sm hidden sm:block">{t("matchVerify")}</p>
        </div>

        {/* Desktop */}
        <div className="hidden sm:flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => {}}>
            <RefreshCw className="h-4 w-4 mr-2" />{t("refresh")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />{t("exportCsv")}
          </Button>
        </div>

        {/* Mobile: Actions dropdown */}
        <div className="relative sm:hidden flex-shrink-0" ref={actionsRef}>
          <Button variant="outline" size="sm" onClick={() => setActionsOpen((v) => !v)} className="flex items-center gap-1">
            <MoreVertical className="h-4 w-4" />
            Actions
          </Button>
          {actionsOpen && (
            <div className="absolute right-0 mt-1 w-44 rounded-lg border border-gray-200 bg-white shadow-lg z-50 dark:border-gray-700 dark:bg-gray-900">
              <button
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 rounded-t-lg"
                onClick={() => { setActionsOpen(false); }}
              >
                <RefreshCw className="h-4 w-4" />{t("refresh")}
              </button>
              <button
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 rounded-b-lg"
                onClick={() => { handleExportCSV(); setActionsOpen(false); }}
              >
                <Download className="h-4 w-4" />{t("exportCsv")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {t("matched")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{matched}</div>
            <p className="text-xs text-muted-foreground">
              {filtered.length > 0 ? Math.round((matched / filtered.length) * 100) : 0}{t("matchRate")}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              {t("unmatched")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unmatched}</div>
            <p className="text-xs text-muted-foreground">{t("requiresAttention")}</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              {t("pending")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pending}</div>
            <p className="text-xs text-muted-foreground">{t("awaitingConfirmation")}</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-500" />
              {t("totalDiscrepancy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${totalDifference.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{t("acrossRecords")}</p>
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
            <div className="w-full sm:flex-1 sm:min-w-48">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("searchReconciliation")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder={t("status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatusesRec")}</SelectItem>
                <SelectItem value="matched">{t("matched")}</SelectItem>
                <SelectItem value="unmatched">{t("unmatched")}</SelectItem>
                <SelectItem value="pending">{t("pending")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={terminalFilter} onValueChange={setTerminalFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder={t("terminals")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allTerminalsRec")}</SelectItem>
                {terminals.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder={t("dateRange")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allDates")}</SelectItem>
                <SelectItem value="today">{t("today")}</SelectItem>
                <SelectItem value="yesterday">{t("yesterday")}</SelectItem>
                <SelectItem value="week">{t("thisWeek")}</SelectItem>
                <SelectItem value="month">{t("thisMonth")}</SelectItem>
              </SelectContent>
            </Select>
            {isAdmin && (
              <Select
                value={selectedCustomer ? String(selectedCustomer.id) : "all"}
                onValueChange={(v) => setSelectedCustomer(v === "all" ? null : (customers.find((c) => String(c.id) === v) ?? null))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t("allCustomers")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allCustomers")}</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reconciliation Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("reconciliationRecords")}</CardTitle>
          <CardDescription>{filtered.length} {t("recordsFound")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="max-h-[600px] overflow-y-auto overflow-x-auto rounded-md border">
            <Table className="min-w-[700px]">
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="whitespace-nowrap">{t("recId")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("date")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("transactionId2")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("terminals")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("paymentMethod")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("expected")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("actual")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("difference")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      {t("noRecordsMatchFilters")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell className="font-medium">{rec.id}</TableCell>
                      <TableCell>{new Date(rec.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono text-sm">{rec.transactionId}</TableCell>
                      <TableCell>{rec.terminal}</TableCell>
                      <TableCell>{rec.paymentMethod}</TableCell>
                      <TableCell>${rec.expectedAmount.toFixed(2)}</TableCell>
                      <TableCell>${rec.actualAmount.toFixed(2)}</TableCell>
                      <TableCell
                        className={
                          rec.difference === 0
                            ? "text-green-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {rec.difference === 0
                          ? "—"
                          : `${rec.difference > 0 ? "+" : ""}$${rec.difference.toFixed(2)}`}
                      </TableCell>
                      <TableCell>{getStatusBadge(rec.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
