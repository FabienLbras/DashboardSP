import { useState, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  Download, TrendingUp, TrendingDown, BarChart2, FileText,
  Activity, DollarSign, CheckCircle, XCircle, ChevronUp, ChevronDown,
  ChevronsUpDown, Search,
} from "lucide-react";
import { mockEndOfDay, mockTransactions } from "../data/mockData";

// ── Types ────────────────────────────────────────────────────────────────────
type Tab = "transactions" | "eod" | "statistics";
type SortDir = "asc" | "desc" | null;

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function csvDownload(filename: string, rows: string[][]) {
  const content = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Sort icon helper ──────────────────────────────────────────────────────────
function SortIcon({ col, sort }: { col: string; sort: { col: string; dir: SortDir } }) {
  if (sort.col !== col) return <ChevronsUpDown className="inline h-3 w-3 ml-1 text-gray-400" />;
  return sort.dir === "asc"
    ? <ChevronUp className="inline h-3 w-3 ml-1 text-blue-600" />
    : <ChevronDown className="inline h-3 w-3 ml-1 text-blue-600" />;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Reports() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("transactions");

  // ── Date range ───────────────────────────────────────────────────────────────
  const [fromDate, setFromDate] = useState("2024-01-01");
  const [toDate, setToDate] = useState("2024-01-15");

  // ── Transaction filters ──────────────────────────────────────────────────────
  const [txSearch, setTxSearch] = useState("");
  const [txStatus, setTxStatus] = useState("all");
  const [txMethod, setTxMethod] = useState("all");
  const [txSort, setTxSort] = useState<{ col: string; dir: SortDir }>({ col: "date", dir: "desc" });
  const [txChartType, setTxChartType] = useState<"area" | "bar" | "line">("area");

  // ── EOD filters ──────────────────────────────────────────────────────────────
  const [eodSearch, setEodSearch] = useState("");
  const [eodSort, setEodSort] = useState<{ col: string; dir: SortDir }>({ col: "date", dir: "desc" });
  const [eodChartMetric, setEodChartMetric] = useState<"totalAmount" | "totalTransactions" | "failedTransactions">("totalAmount");
  const [eodChartType, setEodChartType] = useState<"area" | "bar" | "line">("area");

  // ── Generic sort toggle ───────────────────────────────────────────────────────
  function toggleSort(
    col: string,
    current: { col: string; dir: SortDir },
    set: (v: { col: string; dir: SortDir }) => void
  ) {
    if (current.col !== col) { set({ col, dir: "asc" }); return; }
    if (current.dir === "asc") { set({ col, dir: "desc" }); return; }
    set({ col, dir: "asc" });
  }

  // ─── Filtered & sorted transactions ─────────────────────────────────────────
  const filteredTx = useMemo(() => {
    const from = fromDate ? new Date(fromDate).getTime() : 0;
    const to = toDate ? new Date(toDate + "T23:59:59Z").getTime() : Infinity;
    let rows = mockTransactions.filter((t) => {
      const d = new Date(t.date).getTime();
      if (d < from || d > to) return false;
      if (txStatus !== "all" && t.status !== txStatus) return false;
      if (txMethod !== "all" && t.paymentMethod !== txMethod) return false;
      if (txSearch) {
        const q = txSearch.toLowerCase();
        if (!t.id.toLowerCase().includes(q) && !t.customer.toLowerCase().includes(q) && !t.location.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    if (txSort.dir) {
      rows = [...rows].sort((a, b) => {
        let av: number | string, bv: number | string;
        if (txSort.col === "amount") { av = a.amount; bv = b.amount; }
        else if (txSort.col === "date") { av = new Date(a.date).getTime(); bv = new Date(b.date).getTime(); }
        else { av = (a as any)[txSort.col] || ""; bv = (b as any)[txSort.col] || ""; }
        if (av < bv) return txSort.dir === "asc" ? -1 : 1;
        if (av > bv) return txSort.dir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [fromDate, toDate, txStatus, txMethod, txSearch, txSort]);

  // ─── Transaction chart data (daily aggregation) ───────────────────────────
  const txChartData = useMemo(() => {
    const map: Record<string, { date: string; revenue: number; count: number; failed: number }> = {};
    filteredTx.forEach((t) => {
      const day = t.date.slice(0, 10);
      if (!map[day]) map[day] = { date: day, revenue: 0, count: 0, failed: 0 };
      map[day].revenue += t.amount;
      map[day].count += 1;
      if (t.status === "failed") map[day].failed += 1;
    });
    return Object.values(map)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({ ...d, revenue: parseFloat(d.revenue.toFixed(2)), date: fmtDate(d.date) }));
  }, [filteredTx]);

  // KPIs for transactions
  const txKpis = useMemo(() => {
    const total = filteredTx.reduce((s, t) => s + t.amount, 0);
    const completed = filteredTx.filter((t) => t.status === "completed").length;
    const failed = filteredTx.filter((t) => t.status === "failed").length;
    const refunded = filteredTx.filter((t) => t.status === "refunded").length;
    return { total, completed, failed, refunded, count: filteredTx.length, avg: filteredTx.length ? total / filteredTx.length : 0 };
  }, [filteredTx]);

  // Payment method breakdown
  const txMethodBreakdown = useMemo(() => {
    const map: Record<string, { name: string; count: number; amount: number }> = {};
    filteredTx.forEach((t) => {
      if (!map[t.paymentMethod]) map[t.paymentMethod] = { name: t.paymentMethod, count: 0, amount: 0 };
      map[t.paymentMethod].count += 1;
      map[t.paymentMethod].amount += t.amount;
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [filteredTx]);

  // ─── Filtered & sorted EOD ───────────────────────────────────────────────────
  const filteredEod = useMemo(() => {
    const from = fromDate ? new Date(fromDate).getTime() : 0;
    const to = toDate ? new Date(toDate + "T23:59:59Z").getTime() : Infinity;
    let rows = mockEndOfDay.filter((e) => {
      const d = new Date(e.date).getTime();
      if (d < from || d > to) return false;
      if (eodSearch) {
        const q = eodSearch.toLowerCase();
        if (!e.id.toLowerCase().includes(q) && !e.date.includes(q)) return false;
      }
      return true;
    });
    if (eodSort.dir) {
      rows = [...rows].sort((a, b) => {
        const av = (a as any)[eodSort.col] ?? "";
        const bv = (b as any)[eodSort.col] ?? "";
        if (av < bv) return eodSort.dir === "asc" ? -1 : 1;
        if (av > bv) return eodSort.dir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [fromDate, toDate, eodSearch, eodSort]);

  // EOD chart data
  const eodChartData = useMemo(() =>
    [...filteredEod]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => ({
        date: fmtDate(e.date),
        totalAmount: e.totalAmount,
        totalTransactions: e.totalTransactions,
        failedTransactions: e.failedTransactions,
      })),
    [filteredEod]
  );

  // EOD KPIs
  const eodKpis = useMemo(() => {
    const totalRev = filteredEod.reduce((s, e) => s + e.totalAmount, 0);
    const totalTx = filteredEod.reduce((s, e) => s + e.totalTransactions, 0);
    const totalFailed = filteredEod.reduce((s, e) => s + e.failedTransactions, 0);
    const avgRev = filteredEod.length ? totalRev / filteredEod.length : 0;
    return { totalRev, totalTx, totalFailed, avgRev, days: filteredEod.length };
  }, [filteredEod]);

  // EOD day-over-day
  const eodWithDelta = useMemo(() => {
    const sorted = [...filteredEod].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map((e, i) => {
      const prev = sorted[i - 1];
      const delta = prev ? ((e.totalAmount - prev.totalAmount) / prev.totalAmount) * 100 : null;
      return { ...e, delta };
    }).reverse();
  }, [filteredEod]);

  // ─── Statistics ───────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    // Day-of-week analysis from all EOD data
    const dowRevenue: number[] = Array(7).fill(0);
    const dowCount: number[] = Array(7).fill(0);
    const dowTx: number[] = Array(7).fill(0);
    mockEndOfDay.forEach((e) => {
      const dow = new Date(e.date).getDay();
      dowRevenue[dow] += e.totalAmount;
      dowTx[dow] += e.totalTransactions;
      dowCount[dow] += 1;
    });
    const avgRevByDow = dowRevenue.map((r, i) => ({
      day: DAY_SHORT[i],
      avgRevenue: dowCount[i] ? parseFloat((r / dowCount[i]).toFixed(2)) : 0,
      avgTransactions: dowCount[i] ? parseFloat((dowTx[i] / dowCount[i]).toFixed(1)) : 0,
      days: dowCount[i],
    }));

    // Best / worst day
    const byRevSorted = [...avgRevByDow].sort((a, b) => b.avgRevenue - a.avgRevenue);
    const best = byRevSorted[0];
    const worst = byRevSorted[byRevSorted.length - 1];

    // Weekday vs weekend
    const weekdayRev = [1, 2, 3, 4, 5].reduce((s, d) => s + (avgRevByDow[d]?.avgRevenue || 0), 0) / 5;
    const weekendRev = [0, 6].reduce((s, d) => s + (avgRevByDow[d]?.avgRevenue || 0), 0) / 2;

    // Failure rate by day
    const dowFailed: number[] = Array(7).fill(0);
    const dowSuccess: number[] = Array(7).fill(0);
    mockEndOfDay.forEach((e) => {
      const dow = new Date(e.date).getDay();
      dowFailed[dow] += e.failedTransactions;
      dowSuccess[dow] += e.successTransactions;
    });
    const failRateByDow = dowFailed.map((f, i) => ({
      day: DAY_SHORT[i],
      failRate: dowSuccess[i] + f > 0 ? parseFloat(((f / (dowSuccess[i] + f)) * 100).toFixed(1)) : 0,
    }));

    // Monthly trend (group by month)
    const monthMap: Record<string, { month: string; revenue: number; transactions: number; count: number }> = {};
    mockEndOfDay.forEach((e) => {
      const m = e.date.slice(0, 7);
      if (!monthMap[m]) monthMap[m] = { month: m, revenue: 0, transactions: 0, count: 0 };
      monthMap[m].revenue += e.totalAmount;
      monthMap[m].transactions += e.totalTransactions;
      monthMap[m].count += 1;
    });
    const monthlyTrend = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month)).map((m) => ({
      ...m,
      revenue: parseFloat(m.revenue.toFixed(2)),
      label: new Date(m.month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    }));

    return { avgRevByDow, best, worst, weekdayRev, weekendRev, failRateByDow, monthlyTrend };
  }, []);

  // ── Custom Tooltip ────────────────────────────────────────────────────────────
  function CustomTooltip({
    active, payload, label, yFormatter, xLabel,
  }: {
    active?: boolean;
    payload?: any[];
    label?: string;
    yFormatter?: (v: number) => string;
    xLabel?: string;
  }) {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2.5 text-sm">
        <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1.5">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-xs">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-gray-500 dark:text-gray-400">{p.name}:</span>
            <span className="font-medium text-gray-800 dark:text-gray-100">
              {yFormatter && (p.name.includes("Revenue") || p.name.includes("$"))
                ? yFormatter(p.value)
                : p.value?.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // ── Chart renderer helper ─────────────────────────────────────────────────────
  function renderChart(
    type: "area" | "bar" | "line",
    data: any[],
    dataKeys: { key: string; color: string; label: string }[],
    xKey: string,
    yFormatter?: (v: number) => string,
    xAxisLabel?: string,
    yAxisLabel?: string,
  ) {
    const common = {
      data,
      margin: { top: 10, right: 20, left: 20, bottom: xAxisLabel ? 30 : 10 },
    };
    const axis = (
      <>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11 }}
          label={xAxisLabel ? { value: xAxisLabel, position: "insideBottom", offset: -15, fontSize: 12, fill: "#6b7280" } : undefined}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={yFormatter}
          width={yFormatter ? 80 : 50}
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "insideLeft", offset: 10, fontSize: 12, fill: "#6b7280" } : undefined}
        />
        <Tooltip content={<CustomTooltip yFormatter={yFormatter} />} />
        <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
      </>
    );
    if (type === "bar") return (
      <BarChart {...common}>
        {axis}
        {dataKeys.map((dk) => <Bar key={dk.key} dataKey={dk.key} name={dk.label} fill={dk.color} radius={[3, 3, 0, 0]} />)}
      </BarChart>
    );
    if (type === "line") return (
      <LineChart {...common}>
        {axis}
        {dataKeys.map((dk) => <Line key={dk.key} type="monotone" dataKey={dk.key} name={dk.label} stroke={dk.color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />)}
      </LineChart>
    );
    return (
      <AreaChart {...common}>
        {axis}
        {dataKeys.map((dk, i) => (
          <Area key={dk.key} type="monotone" dataKey={dk.key} name={dk.label} stroke={dk.color} fill={dk.color} fillOpacity={i === 0 ? 0.15 : 0.08} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        ))}
      </AreaChart>
    );
  }

  // ── CSV exports ───────────────────────────────────────────────────────────────
  function exportTxCsv() {
    const headers = ["ID", "Date", "Customer", "Location", "Payment Method", "Status", "Terminal", "Amount"];
    const rows = filteredTx.map((t) => [t.id, t.date, t.customer, t.location, t.paymentMethod, t.status, t.terminal, t.amount.toFixed(2)]);
    csvDownload("transactions_report.csv", [headers, ...rows]);
  }
  function exportEodCsv() {
    const headers = ["ID", "Date", "Total Tx", "Success", "Failed", "Total Amount", "Avg Tx"];
    const rows = filteredEod.map((e) => [e.id, e.date, String(e.totalTransactions), String(e.successTransactions), String(e.failedTransactions), e.totalAmount.toFixed(2), e.averageTransaction.toFixed(2)]);
    csvDownload("eod_report.csv", [headers, ...rows]);
  }

  // ── Tab button ────────────────────────────────────────────────────────────────
  const tabBtn = (id: Tab, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
        tab === id
          ? "bg-blue-700 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      }`}
    >
      {icon}{label}
    </button>
  );

  // ── Date range bar ─────────────────────────────────────────────────────────────
  const dateBar = (
    <Card className="mb-6">
      <CardContent className="py-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap text-sm">{t("from")}</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap text-sm">{t("to")}</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
          </div>
          {[
            { label: "Last 7d",  from: "2024-01-09", to: "2024-01-15" },
            { label: "Last 14d", from: "2024-01-01", to: "2024-01-15" },
            { label: "Dec 2023", from: "2023-12-01", to: "2023-12-31" },
            { label: "All",      from: "2023-12-01", to: "2024-01-15" },
          ].map((p) => (
            <Button key={p.label} variant="outline" size="sm" onClick={() => { setFromDate(p.from); setToDate(p.to); }}>
              {p.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2">
            <BarChart2 className="h-8 w-8 text-blue-600" />
            {t("reportsTitle")}
          </h1>
          <p className="text-muted-foreground">{t("financialAnalytics")}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {tabBtn("transactions", t("transactions"), <Activity className="h-4 w-4" />)}
        {tabBtn("eod", t("endOfDay"), <FileText className="h-4 w-4" />)}
        {tabBtn("statistics", t("statistics"), <TrendingUp className="h-4 w-4" />)}
      </div>

      {/* ── TRANSACTIONS TAB ─────────────────────────────────────────────────── */}
      {tab === "transactions" && (
        <div className="space-y-6">
          {dateBar}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: t("totalRevenue"), value: fmt(txKpis.total), icon: <DollarSign className="h-4 w-4 text-blue-500" /> },
              { label: t("transactions"), value: txKpis.count, icon: <Activity className="h-4 w-4 text-indigo-500" /> },
              { label: t("avgAmount"), value: fmt(txKpis.avg), icon: <TrendingUp className="h-4 w-4 text-green-500" /> },
              { label: t("completed"), value: txKpis.completed, icon: <CheckCircle className="h-4 w-4 text-green-500" />, color: "text-green-600" },
              { label: t("failed"), value: txKpis.failed, icon: <XCircle className="h-4 w-4 text-red-500" />, color: "text-red-600" },
              { label: t("refunded"), value: txKpis.refunded, icon: <TrendingDown className="h-4 w-4 text-orange-500" />, color: "text-orange-600" },
            ].map((k) => (
              <Card key={k.label} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">{k.icon}{k.label}</div>
                  <div className={`text-xl font-bold ${(k as any).color || ""}`}>{k.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>{t("revenueOverTime")}</CardTitle>
                <CardDescription>{t("dailyRevenueCount")}</CardDescription>
              </div>
              <div className="flex gap-2">
                {(["area", "bar", "line"] as const).map((t) => (
                  <Button key={t} size="sm" variant={txChartType === t ? "default" : "outline"} onClick={() => setTxChartType(t)} className={txChartType === t ? "bg-blue-700 text-white" : ""}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {txChartData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">{t("noDataForRange")}</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  {renderChart(
                    txChartType,
                    txChartData,
                    [
                      { key: "revenue", color: "#3b82f6", label: `${t("revenue")} ($)` },
                      { key: "count", color: "#10b981", label: t("transactions") },
                    ],
                    "date",
                    (v) => `$${v.toLocaleString()}`,
                    t("date"),
                    `${t("amount")} / ${t("count")}`,
                  )}
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Payment Method Breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>{t("paymentMethods")}</CardTitle></CardHeader>
              <CardContent>
                {txMethodBreakdown.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 text-sm">{t("noData")}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={txMethodBreakdown} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {txMethodBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => v} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t("amountByMethod")}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3 mt-1">
                  {txMethodBreakdown.map((m, i) => {
                    const pct = txKpis.total > 0 ? (m.amount / txKpis.total) * 100 : 0;
                    return (
                      <div key={m.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{m.name}</span>
                          <span className="text-muted-foreground">{fmt(m.amount)} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                  {txMethodBreakdown.length === 0 && <div className="text-center text-muted-foreground py-8 text-sm">{t("noData")}</div>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("transactionDetails")}</CardTitle>
                <CardDescription>{filteredTx.length} {t("transactions")}</CardDescription>
              </div>
              <Button onClick={exportTxCsv} variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />{t("exportCsv")}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t("searchIdCustomer")} value={txSearch} onChange={(e) => setTxSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={txStatus} onValueChange={setTxStatus}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allStatuses")}</SelectItem>
                    <SelectItem value="completed">{t("completed")}</SelectItem>
                    <SelectItem value="failed">{t("failed")}</SelectItem>
                    <SelectItem value="refunded">{t("refunded")}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={txMethod} onValueChange={setTxMethod}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="Method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allMethods")}</SelectItem>
                    {["Visa", "Mastercard", "American Express", "Apple Pay", "Google Pay"].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {[
                        { col: "id", label: "ID" },
                        { col: "date", label: t("date") },
                        { col: "customer", label: t("customer") },
                        { col: "location", label: t("location") },
                        { col: "paymentMethod", label: t("paymentMethod") },
                        { col: "status", label: t("status") },
                        { col: "amount", label: t("amount") },
                      ].map(({ col, label }) => (
                        <TableHead key={col} className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort(col, txSort, setTxSort)}>
                          {label}<SortIcon col={col} sort={txSort} />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTx.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">{t("noTransactionsMatchFilters")}</TableCell></TableRow>
                    ) : filteredTx.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">{t.id}</TableCell>
                        <TableCell className="text-sm">{new Date(t.date).toLocaleString()}</TableCell>
                        <TableCell>{t.customer}</TableCell>
                        <TableCell className="text-muted-foreground">{t.location}</TableCell>
                        <TableCell>{t.paymentMethod}</TableCell>
                        <TableCell>
                          <Badge className={
                            t.status === "completed" ? "bg-green-100 text-green-800" :
                            t.status === "failed" ? "bg-red-100 text-red-800" :
                            "bg-orange-100 text-orange-800"
                          }>{t.status}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{fmt(t.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── EOD TAB ──────────────────────────────────────────────────────────── */}
      {tab === "eod" && (
        <div className="space-y-6">
          {dateBar}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: t("totalRevenue"), value: fmt(eodKpis.totalRev), icon: <DollarSign className="h-4 w-4 text-blue-500" /> },
              { label: t("totalTransactions"), value: eodKpis.totalTx, icon: <Activity className="h-4 w-4 text-indigo-500" /> },
              { label: t("avgDailyRevenue"), value: fmt(eodKpis.avgRev), icon: <TrendingUp className="h-4 w-4 text-green-500" /> },
              { label: t("totalFailed"), value: eodKpis.totalFailed, icon: <XCircle className="h-4 w-4 text-red-500" />, color: "text-red-600" },
              { label: t("daysReported"), value: eodKpis.days, icon: <FileText className="h-4 w-4 text-purple-500" /> },
            ].map((k) => (
              <Card key={k.label} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">{k.icon}{k.label}</div>
                  <div className={`text-xl font-bold ${(k as any).color || ""}`}>{k.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>{t("eodTrend")}</CardTitle>
                <CardDescription>{t("dailyFinancialPerf")}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={eodChartMetric} onValueChange={(v) => setEodChartMetric(v as any)}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="totalAmount">{t("revenue")}</SelectItem>
                    <SelectItem value="totalTransactions">{t("transactions")}</SelectItem>
                    <SelectItem value="failedTransactions">{t("failedTransactions")}</SelectItem>
                  </SelectContent>
                </Select>
                {(["area", "bar", "line"] as const).map((t) => (
                  <Button key={t} size="sm" variant={eodChartType === t ? "default" : "outline"} onClick={() => setEodChartType(t)} className={eodChartType === t ? "bg-blue-700 text-white" : ""}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {eodChartData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">{t("noDataForRange")}</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  {renderChart(
                    eodChartType,
                    eodChartData,
                    [{
                      key: eodChartMetric,
                      color: eodChartMetric === "failedTransactions" ? "#ef4444" : "#3b82f6",
                      label: eodChartMetric === "totalAmount" ? `${t("revenue")} ($)` : eodChartMetric === "totalTransactions" ? t("transactions") : t("failedTransactions"),
                    }],
                    "date",
                    eodChartMetric === "totalAmount" ? (v) => `$${v.toLocaleString()}` : undefined,
                    t("date"),
                    eodChartMetric === "totalAmount" ? `${t("revenue")} ($)` : t("count"),
                  )}
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("eodDetails")}</CardTitle>
                <CardDescription>{filteredEod.length} records with day-over-day comparison</CardDescription>
              </div>
              <Button onClick={exportEodCsv} variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />{t("exportCsv")}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t("searchEodId")} value={eodSearch} onChange={(e) => setEodSearch(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {[
                        { col: "id", label: t("eodId") },
                        { col: "date", label: t("date") },
                        { col: "totalTransactions", label: t("totalTx") },
                        { col: "successTransactions", label: t("success") },
                        { col: "failedTransactions", label: t("failed") },
                        { col: "totalAmount", label: t("revenue") },
                        { col: "averageTransaction", label: t("avgTx") },
                      ].map(({ col, label }) => (
                        <TableHead key={col} className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort(col, eodSort, setEodSort)}>
                          {label}<SortIcon col={col} sort={eodSort} />
                        </TableHead>
                      ))}
                      <TableHead>{t("vsPrevDay")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eodWithDelta.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">{t("noRecordsMatch")}</TableCell></TableRow>
                    ) : eodWithDelta.map((e) => {
                      const failRate = e.totalTransactions > 0 ? (e.failedTransactions / e.totalTransactions) * 100 : 0;
                      return (
                        <TableRow key={e.id}>
                          <TableCell className="font-mono text-xs">{e.id}</TableCell>
                          <TableCell className="font-medium">{fmtDate(e.date)}</TableCell>
                          <TableCell>{e.totalTransactions}</TableCell>
                          <TableCell className="text-green-600">{e.successTransactions}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              {e.failedTransactions}
                              {failRate > 5 && (
                                <Badge className="bg-red-100 text-red-700 text-xs px-1">{failRate.toFixed(1)}%</Badge>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{fmt(e.totalAmount)}</TableCell>
                          <TableCell>{fmt(e.averageTransaction)}</TableCell>
                          <TableCell>
                            {e.delta === null ? (
                              <span className="text-muted-foreground text-xs">—</span>
                            ) : e.delta >= 0 ? (
                              <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                <TrendingUp className="h-3.5 w-3.5" />+{e.delta.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                                <TrendingDown className="h-3.5 w-3.5" />{e.delta.toFixed(1)}%
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── STATISTICS TAB ───────────────────────────────────────────────────── */}
      {tab === "statistics" && (
        <div className="space-y-6">
          {/* Insights cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="pt-4 pb-4">
                <div className="text-xs text-green-700 font-medium uppercase mb-1">{t("bestPerformingDay")}</div>
                <div className="text-2xl font-bold text-green-800">{DAYS[DAY_SHORT.indexOf(stats.best?.day)]}</div>
                <div className="text-sm text-green-700 mt-0.5">Avg {fmt(stats.best?.avgRevenue || 0)} / day</div>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardContent className="pt-4 pb-4">
                <div className="text-xs text-red-700 font-medium uppercase mb-1">{t("weakestDay")}</div>
                <div className="text-2xl font-bold text-red-800">{DAYS[DAY_SHORT.indexOf(stats.worst?.day)]}</div>
                <div className="text-sm text-red-700 mt-0.5">
                  Avg {fmt(stats.worst?.avgRevenue || 0)} / day
                  {stats.best && stats.worst && (
                    <span> ({(((stats.worst.avgRevenue - stats.best.avgRevenue) / stats.best.avgRevenue) * 100).toFixed(0)}% vs best)</span>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="pt-4 pb-4">
                <div className="text-xs text-blue-700 font-medium uppercase mb-1">{t("weekdayVsWeekend")}</div>
                <div className="text-2xl font-bold text-blue-800">{stats.weekdayRev > stats.weekendRev ? t("weekdaysHigher") : t("weekendsHigher")}</div>
                <div className="text-sm text-blue-700 mt-0.5">
                  Weekday avg {fmt(stats.weekdayRev)} · Weekend avg {fmt(stats.weekendRev)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Avg Revenue by Day of Week */}
          <Card>
            <CardHeader>
              <CardTitle>{t("avgRevByDayOfWeek")}</CardTitle>
              <CardDescription>Based on all available EOD data</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.avgRevByDow} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={60} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={(l) => DAYS[DAY_SHORT.indexOf(l)]} />
                  <Bar dataKey="avgRevenue" name={t("avgRevenue")} radius={[4, 4, 0, 0]}>
                    {stats.avgRevByDow.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.day === stats.best?.day ? "#10b981" : entry.day === stats.worst?.day ? "#ef4444" : "#3b82f6"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Avg Transactions & Failure Rate side by side */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("avgTxByDayOfWeek")}</CardTitle>
                <CardDescription>Transaction volume patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.avgRevByDow} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={(l) => DAYS[DAY_SHORT.indexOf(l)]} />
                    <Bar dataKey="avgTransactions" name={t("avgTransactions")} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 grid grid-cols-7 gap-1">
                  {stats.avgRevByDow.map((d) => (
                    <div key={d.day} className="text-center">
                      <div className="text-xs font-medium text-gray-500">{d.day}</div>
                      <div className="text-xs font-bold">{d.avgTransactions}</div>
                      <div className="text-xs text-muted-foreground">{d.days}d</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("failureRateByDay")}</CardTitle>
                <CardDescription>% failed transactions per day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.failRateByDow} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `${v}%`} labelFormatter={(l) => DAYS[DAY_SHORT.indexOf(l)]} />
                    <Bar dataKey="failRate" name={t("failureRate")} fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>{t("monthlyRevenueTrend")}</CardTitle>
              <CardDescription>Aggregated revenue by month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={stats.monthlyTrend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={70} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Area type="monotone" dataKey="revenue" name={t("revenue")} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Full breakdown table */}
          <Card>
            <CardHeader>
              <CardTitle>{t("dayOfWeekBreakdown")}</CardTitle>
              <CardDescription>Detailed stats per day of week</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("date")}</TableHead>
                    <TableHead>{t("avgRevenue")}</TableHead>
                    <TableHead>{t("avgTransactions")}</TableHead>
                    <TableHead>{t("failureRate")}</TableHead>
                    <TableHead>{t("vsBestDay")}</TableHead>
                    <TableHead>{t("sampleDays")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.avgRevByDow.map((d, i) => {
                    const failRate = stats.failRateByDow[i]?.failRate || 0;
                    const vsBest = stats.best ? ((d.avgRevenue - stats.best.avgRevenue) / stats.best.avgRevenue) * 100 : 0;
                    const isBest = d.day === stats.best?.day;
                    const isWorst = d.day === stats.worst?.day;
                    return (
                      <TableRow key={d.day} className={isBest ? "bg-green-50 dark:bg-green-950/20" : isWorst ? "bg-red-50 dark:bg-red-950/20" : ""}>
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-2">
                            {DAYS[i]}
                            {isBest && <Badge className="bg-green-100 text-green-700 text-xs">Best</Badge>}
                            {isWorst && <Badge className="bg-red-100 text-red-700 text-xs">Lowest</Badge>}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{fmt(d.avgRevenue)}</TableCell>
                        <TableCell>{d.avgTransactions}</TableCell>
                        <TableCell>
                          <Badge className={failRate > 6 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}>
                            {failRate}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isBest ? (
                            <span className="text-green-600 font-medium">—</span>
                          ) : (
                            <span className={vsBest < 0 ? "text-red-600" : "text-green-600"}>
                              {vsBest >= 0 ? "+" : ""}{vsBest.toFixed(1)}%
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{d.days}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
