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
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  DollarSign,
  TrendingUp,
  GitMerge,
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [terminalFilter, setTerminalFilter] = useState("all");

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
            Matched
          </Badge>
        );
      case "unmatched":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200 gap-1">
            <XCircle className="h-3 w-3" />
            Unmatched
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 gap-1">
            <AlertCircle className="h-3 w-3" />
            Pending
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2">
            <GitMerge className="h-8 w-8 text-blue-600" />
            Reconciliation
          </h1>
          <p className="text-muted-foreground">
            Match and verify transactions against expected records
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {}}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Matched
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{matched}</div>
            <p className="text-xs text-muted-foreground">
              {filtered.length > 0 ? Math.round((matched / filtered.length) * 100) : 0}% match rate
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Unmatched
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unmatched}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-500" />
              Total Discrepancy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${totalDifference.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Across {unmatched + pending} records</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, transaction ID or terminal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="unmatched">Unmatched</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={terminalFilter} onValueChange={setTerminalFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Terminal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terminals</SelectItem>
                {terminals.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reconciliation Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Records</CardTitle>
          <CardDescription>{filtered.length} records found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[600px] overflow-y-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Rec. ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Terminal</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Difference</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      No records match your filters
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
