import { useState, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../context/AuthContext";
import { useCustomerFilter } from "../context/CustomerFilterContext";
import { isSuperAdmin } from "../lib/permissions";
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
  Download,
  TrendingUp,
  TrendingDown,
  CalendarClock,
  CheckCircle,
  XCircle,
  DollarSign,
  Activity,
  AlertTriangle,
  X,
} from "lucide-react";
import { mockEndOfDay } from "../data/mockData";

export default function EndOfDay() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { selectedCustomer, setSelectedCustomer, customers } = useCustomerFilter();
  const isAdmin = isSuperAdmin(user?.role);

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // Detect missing EOD days in the existing data range
  const missingDays = useMemo(() => {
    if (mockEndOfDay.length < 2) return [];
    const sorted = [...mockEndOfDay].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const dateSet = new Set(sorted.map((e) => e.date));
    const first = new Date(sorted[0].date);
    const last = new Date(sorted[sorted.length - 1].date);
    const missing: string[] = [];
    const cur = new Date(first);
    cur.setDate(cur.getDate() + 1);
    while (cur < last) {
      const iso = cur.toISOString().split("T")[0];
      if (!dateSet.has(iso)) missing.push(iso);
      cur.setDate(cur.getDate() + 1);
    }
    return missing;
  }, []);

  const visibleAlerts = missingDays.filter((d) => !dismissedAlerts.includes(d));

  const filtered = mockEndOfDay.filter((eod) => {
    const matchesSearch =
      eod.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eod.date.includes(searchTerm);

    let matchesDate = true;
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const eodDate = new Date(eod.date);
      if (dateFilter === "today") {
        matchesDate = eodDate >= today;
      } else if (dateFilter === "yesterday") {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        matchesDate = eodDate >= yesterday && eodDate < today;
      } else if (dateFilter === "week") {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDate = eodDate >= weekAgo;
      } else if (dateFilter === "month") {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchesDate = eodDate >= monthAgo;
      }
    }

    let matchesStatus = true;
    if (statusFilter === "high_failure") {
      matchesStatus = eod.failedTransactions / eod.totalTransactions > 0.07;
    } else if (statusFilter === "low_failure") {
      matchesStatus = eod.failedTransactions / eod.totalTransactions <= 0.07;
    }

    return matchesSearch && matchesDate && matchesStatus;
  });

  // Sort by date descending
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getDayOverDay = (
    current: number,
    index: number,
    field: keyof typeof mockEndOfDay[0]
  ) => {
    const allSorted = [...mockEndOfDay].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const currentIdx = allSorted.findIndex((e) => e.id === sorted[index].id);
    const prev = allSorted[currentIdx + 1];
    if (!prev) return null;
    const prevVal = prev[field] as number;
    if (prevVal === 0) return null;
    return ((current - prevVal) / prevVal) * 100;
  };

  const DeltaBadge = ({ pct }: { pct: number | null }) => {
    if (pct === null) return <span className="text-xs text-muted-foreground">—</span>;
    const isPos = pct >= 0;
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-xs font-medium ${
          isPos ? "text-green-600" : "text-red-600"
        }`}
      >
        {isPos ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {isPos ? "+" : ""}
        {pct.toFixed(1)}%
      </span>
    );
  };

  // Summary of filtered records
  const totalTx = filtered.reduce((s, e) => s + e.totalTransactions, 0);
  const totalSuccess = filtered.reduce((s, e) => s + e.successTransactions, 0);
  const totalFailed = filtered.reduce((s, e) => s + e.failedTransactions, 0);
  const totalRevenue = filtered.reduce((s, e) => s + e.totalAmount, 0);
  const avgTx =
    filtered.length > 0
      ? filtered.reduce((s, e) => s + e.averageTransaction, 0) / filtered.length
      : 0;

  const handleExportCSV = () => {
    const headers = [
      "EOD ID", "Date", "Total Tx", "Success", "Failed", "Total Amount", "Avg Tx",
    ];
    const rows = sorted.map((e) => [
      e.id,
      e.date,
      e.totalTransactions,
      e.successTransactions,
      e.failedTransactions,
      e.totalAmount.toFixed(2),
      e.averageTransaction.toFixed(2),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `end_of_day_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2">
            <CalendarClock className="h-8 w-8 text-blue-600" />
            {t("endOfDay")}
          </h1>
          <p className="text-muted-foreground">
            {t("dailySummaries")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          {t("exportCsv")}
        </Button>
      </div>

      {/* Missing EOD Alerts */}
      {visibleAlerts.length > 0 && (
        <div className="space-y-2">
          {visibleAlerts.map((day) => (
            <div
              key={day}
              className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-300 rounded-lg text-amber-800"
            >
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-medium">{t("missingEod")} — </span>
                <span>
                  {new Date(day + "T12:00:00").toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className="ml-2 text-sm text-amber-600">
                  {t("noEodRecorded")}
                </span>
              </div>
              <button
                onClick={() => setDismissedAlerts((prev) => [...prev, day])}
                className="p-1 rounded hover:bg-amber-100 transition-colors flex-shrink-0"
                aria-label={t("dismissAlert")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" />
              {t("totalTransactions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTx.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{filtered.length} days</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {t("fulfilled")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalSuccess.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalTx > 0 ? Math.round((totalSuccess / totalTx) * 100) : 0}{t("successPct")}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              {t("failed")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalFailed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalTx > 0 ? Math.round((totalFailed / totalTx) * 100) : 0}{t("failurePct")}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              {t("totalRevenue")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg ${avgTx.toFixed(2)} / tx
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
                  placeholder={t("searchEod")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("performance")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value="low_failure">{t("lowFailure")}</SelectItem>
                <SelectItem value="high_failure">{t("highFailure")}</SelectItem>
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

      {/* End of Day Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("eodReports")}</CardTitle>
          <CardDescription>
            {sorted.length} {t("reportsArrows")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[600px] overflow-y-auto overflow-x-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>{t("eodId")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("totalTx")}</TableHead>
                  <TableHead>{t("fulfilled")}</TableHead>
                  <TableHead>{t("failed")}</TableHead>
                  <TableHead>{t("avgTransaction")}</TableHead>
                  <TableHead>{t("amount")}</TableHead>
                  <TableHead>{t("vsDay1")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      {t("noReportsMatch")}
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((eod, idx) => {
                    const revenueChange = getDayOverDay(eod.totalAmount, idx, "totalAmount");
                    const txChange = getDayOverDay(eod.totalTransactions, idx, "totalTransactions");
                    const failureRate = Math.round((eod.failedTransactions / eod.totalTransactions) * 100);

                    return (
                      <TableRow key={eod.id}>
                        <TableCell className="font-medium">{eod.id}</TableCell>
                        <TableCell>
                          {new Date(eod.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {eod.totalTransactions.toLocaleString()}
                            <DeltaBadge pct={txChange} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">
                            {eod.successTransactions.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-red-600 font-medium">
                              {eod.failedTransactions}
                            </span>
                            <Badge
                              className={
                                failureRate > 7
                                  ? "bg-red-100 text-red-700 text-xs"
                                  : "bg-green-100 text-green-700 text-xs"
                              }
                            >
                              {failureRate}%
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>${eod.averageTransaction.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-2">
                            ${eod.totalAmount.toLocaleString()}
                            <DeltaBadge pct={revenueChange} />
                          </div>
                        </TableCell>
                        <TableCell>
                          {revenueChange !== null ? (
                            <div className="flex items-center gap-1">
                              {revenueChange >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                              <span
                                className={`text-sm font-medium ${
                                  revenueChange >= 0 ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {revenueChange >= 0 ? "+" : ""}
                                {revenueChange.toFixed(1)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No prev. day</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
