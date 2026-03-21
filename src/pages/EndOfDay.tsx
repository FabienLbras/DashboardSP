import { useState, useMemo, useEffect, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../context/AuthContext";
import { useCustomerFilter } from "../context/CustomerFilterContext";
import { usePropertyFilter } from "../context/PropertyFilterContext";
import { isSuperAdmin, isPlatformAdmin } from "../lib/permissions";
import PropertyFilterSelect from "../components/common/PropertyFilterSelect";
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
  MoreVertical,
} from "lucide-react";
import { EodService, type EodReport } from "../services/eodService";

export default function EndOfDay() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { selectedCustomer, setSelectedCustomer, customers } = useCustomerFilter();
  const { selectedProperty } = usePropertyFilter();
  const isAdmin = isSuperAdmin(user?.role);
  const isHotelMgr = user?.role === "hotel_manager";

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [reports, setReports] = useState<EodReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) setActionsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const params: Record<string, number> = {};
    if (selectedCustomer) params.customer_id = selectedCustomer.id;
    if (selectedProperty) params.property_id = selectedProperty.id;
    EodService.list(params)
      .then((res) => setReports(res.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCustomer, selectedProperty]);

  // Detect missing EOD days in the existing data range
  const missingDays = useMemo(() => {
    if (reports.length < 2) return [];
    const sorted = [...reports].sort(
      (a, b) => new Date(a.report_date).getTime() - new Date(b.report_date).getTime()
    );
    const dateSet = new Set(sorted.map((e) => e.report_date));
    const first = new Date(sorted[0].report_date);
    const last = new Date(sorted[sorted.length - 1].report_date);
    const missing: string[] = [];
    const cur = new Date(first);
    cur.setDate(cur.getDate() + 1);
    while (cur < last) {
      const iso = cur.toISOString().split("T")[0];
      if (!dateSet.has(iso)) missing.push(iso);
      cur.setDate(cur.getDate() + 1);
    }
    return missing;
  }, [reports]);

  const visibleAlerts = missingDays.filter((d) => !dismissedAlerts.includes(d));

  const filtered = reports.filter((eod) => {
    const matchesSearch =
      String(eod.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      eod.report_date.includes(searchTerm) ||
      (eod.terminal_name || "").toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const eodDate = new Date(eod.report_date);
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
      matchesStatus = eod.total_transactions > 0 && eod.failed_transactions / eod.total_transactions > 0.07;
    } else if (statusFilter === "low_failure") {
      matchesStatus = eod.total_transactions === 0 || eod.failed_transactions / eod.total_transactions <= 0.07;
    }

    return matchesSearch && matchesDate && matchesStatus;
  });

  // Sort by date descending
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime()
  );

  const getDayOverDay = (current: number, index: number, field: keyof EodReport) => {
    const allSorted = [...reports].sort(
      (a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime()
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
  const totalTx = filtered.reduce((s, e) => s + (e.total_transactions || 0), 0);
  const totalSuccess = filtered.reduce((s, e) => s + (e.successful_transactions || 0), 0);
  const totalFailed = filtered.reduce((s, e) => s + (e.failed_transactions || 0), 0);
  const totalRevenue = filtered.reduce((s, e) => s + parseFloat(String(e.total_amount || 0)), 0);
  const avgTx =
    filtered.length > 0
      ? filtered.reduce((s, e) => s + parseFloat(String(e.avg_amount || 0)), 0) / filtered.length
      : 0;

  const handleExportCSV = () => {
    const headers = [
      "ID", "Date", "Terminal", "Total Tx", "Success", "Failed", "Total Amount", "Avg Tx",
    ];
    const rows = sorted.map((e) => [
      e.id,
      e.report_date,
      e.terminal_name || "",
      e.total_transactions,
      e.successful_transactions,
      e.failed_transactions,
      parseFloat(String(e.total_amount)).toFixed(2),
      parseFloat(String(e.avg_amount)).toFixed(2),
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
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary flex items-center gap-2">
            <CalendarClock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
            {t("endOfDay")}
          </h1>
          <p className="text-muted-foreground text-sm hidden sm:block">{t("dailySummaries")}</p>
        </div>

        {/* Desktop: bouton direct */}
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="hidden sm:flex flex-shrink-0">
          <Download className="h-4 w-4 mr-2" />
          {t("exportCsv")}
        </Button>

        {/* Mobile: bouton Actions dropdown */}
        <div className="relative sm:hidden flex-shrink-0" ref={actionsRef}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActionsOpen((v) => !v)}
            className="flex items-center gap-1"
          >
            <MoreVertical className="h-4 w-4" />
            Actions
          </Button>
          {actionsOpen && (
            <div className="absolute right-0 mt-1 w-44 rounded-lg border border-gray-200 bg-white shadow-lg z-50 dark:border-gray-700 dark:bg-gray-900">
              <button
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg"
                onClick={() => { handleExportCSV(); setActionsOpen(false); }}
              >
                <Download className="h-4 w-4" />
                {t("exportCsv")}
              </button>
            </div>
          )}
        </div>
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
            {isHotelMgr && <PropertyFilterSelect />}
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
                  <TableHead>ID</TableHead>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>Terminal</TableHead>
                  <TableHead>{t("totalTx")}</TableHead>
                  <TableHead>{t("fulfilled")}</TableHead>
                  <TableHead>{t("failed")}</TableHead>
                  <TableHead>{t("avgTransaction")}</TableHead>
                  <TableHead>{t("amount")}</TableHead>
                  <TableHead>{t("vsDay1")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      {t("noReportsMatch")}
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((eod, idx) => {
                    const totalAmt = parseFloat(String(eod.total_amount || 0));
                    const avgAmt = parseFloat(String(eod.avg_amount || 0));
                    const revenueChange = getDayOverDay(totalAmt, idx, "total_amount");
                    const txChange = getDayOverDay(eod.total_transactions, idx, "total_transactions");
                    const failureRate = eod.total_transactions > 0
                      ? Math.round((eod.failed_transactions / eod.total_transactions) * 100)
                      : 0;

                    return (
                      <TableRow key={eod.id}>
                        <TableCell className="font-medium">EOD-{eod.id}</TableCell>
                        <TableCell>
                          {new Date(eod.report_date + "T12:00:00").toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {eod.terminal_name || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {eod.total_transactions.toLocaleString()}
                            <DeltaBadge pct={txChange} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">
                            {eod.successful_transactions.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-red-600 font-medium">
                              {eod.failed_transactions}
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
                        <TableCell>${avgAmt.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-2">
                            ${totalAmt.toLocaleString()}
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
