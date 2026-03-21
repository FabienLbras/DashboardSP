import { useState, useMemo, useEffect } from "react";
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
import axios from "axios";
import { AuthService } from "../services/authService";
import { EodService, type EodReport } from "../services/eodService";
import { useAuth } from "../context/AuthContext";
import { usePropertyFilter } from "../context/PropertyFilterContext";
import PropertyFilterSelect from "../components/common/PropertyFilterSelect";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const api = axios.create({ baseURL: API_BASE_URL });
api.interceptors.request.use((config) => {
  const token = AuthService.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Types ────────────────────────────────────────────────────────────────────
type Tab = "transactions" | "eod" | "statistics";
type SortDir = "asc" | "desc" | null;

interface TxRow {
  id: number;
  reference: string | null;
  amount: number;
  currency: string;
  state: string;
  payment_method: string | null;
  customer_name: string | null;
  description: string | null;
  created_at: string;
}

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
  const { user } = useAuth();
  const { selectedProperty } = usePropertyFilter();
  const isHotelMgr = user?.role === "hotel_manager";
  const [tab, setTab] = useState<Tab>("transactions");

  // ── Data from API ────────────────────────────────────────────────────────────
  const [allTx, setAllTx] = useState<TxRow[]>([]);
  const [allEod, setAllEod] = useState<EodReport[]>([]);

  useEffect(() => {
    const params = selectedProperty ? { property_id: selectedProperty.id } : {};
    api.get("/payment/transactions", { params }).then((r) => setAllTx(r.data.items || [])).catch(console.error);
    EodService.list(params).then((r) => setAllEod(r.items)).catch(console.error);
  }, [selectedProperty]);

  // ── Date range ───────────────────────────────────────────────────────────────
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Compute default range from actual data
  const defaultRange = useMemo(() => {
    if (allTx.length === 0 && allEod.length === 0) return { from: "", to: "" };
    const dates = [
      ...allTx.map((t) => t.created_at.slice(0, 10)),
      ...allEod.map((e) => e.report_date),
    ];
    dates.sort();
    return { from: dates[0], to: dates[dates.length - 1] };
  }, [allTx, allEod]);

  const effectiveFrom = fromDate || defaultRange.from;
  const effectiveTo = toDate || defaultRange.to;

  // ── Transaction filters ──────────────────────────────────────────────────────
  const [txSearch, setTxSearch] = useState("");
  const [txStatus, setTxStatus] = useState("all");
  const [txMethod, setTxMethod] = useState("all");
  const [txSort, setTxSort] = useState<{ col: string; dir: SortDir }>({ col: "created_at", dir: "desc" });
  const [txChartType, setTxChartType] = useState<"area" | "bar" | "line">("area");

  // ── EOD filters ──────────────────────────────────────────────────────────────
  const [eodSearch, setEodSearch] = useState("");
  const [eodSort, setEodSort] = useState<{ col: string; dir: SortDir }>({ col: "report_date", dir: "desc" });
  const [eodChartMetric, setEodChartMetric] = useState<"total_amount" | "total_transactions" | "failed_transactions">("total_amount");
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
    const from = effectiveFrom ? new Date(effectiveFrom).getTime() : 0;
    const to = effectiveTo ? new Date(effectiveTo + "T23:59:59Z").getTime() : Infinity;
    let rows = allTx.filter((tx) => {
      const d = new Date(tx.created_at).getTime();
      if (d < from || d > to) return false;
      if (txStatus !== "all" && tx.state !== txStatus) return false;
      if (txMethod !== "all" && tx.payment_method !== txMethod) return false;
      if (txSearch) {
        const q = txSearch.toLowerCase();
        if (
          !String(tx.id).includes(q) &&
          !(tx.reference || "").toLowerCase().includes(q) &&
          !(tx.customer_name || "").toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
    if (txSort.dir) {
      rows = [...rows].sort((a, b) => {
        let av: number | string, bv: number | string;
        if (txSort.col === "amount") { av = a.amount; bv = b.amount; }
        else if (txSort.col === "created_at") { av = new Date(a.created_at).getTime(); bv = new Date(b.created_at).getTime(); }
        else { av = (a as any)[txSort.col] || ""; bv = (b as any)[txSort.col] || ""; }
        if (av < bv) return txSort.dir === "asc" ? -1 : 1;
        if (av > bv) return txSort.dir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [allTx, effectiveFrom, effectiveTo, txStatus, txMethod, txSearch, txSort]);

  // ─── Transaction chart data (daily aggregation) ───────────────────────────
  const txChartData = useMemo(() => {
    const map: Record<string, { date: string; revenue: number; count: number; failed: number }> = {};
    filteredTx.forEach((tx) => {
      const day = tx.created_at.slice(0, 10);
      if (!map[day]) map[day] = { date: day, revenue: 0, count: 0, failed: 0 };
      map[day].revenue += parseFloat(String(tx.amount));
      map[day].count += 1;
      if (tx.state === "FAILED" || tx.state === "failed") map[day].failed += 1;
    });
    return Object.values(map)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({ ...d, revenue: parseFloat(d.revenue.toFixed(2)), date: fmtDate(d.date) }));
  }, [filteredTx]);

  // KPIs for transactions
  const txKpis = useMemo(() => {
    const total = filteredTx.reduce((s, tx) => s + parseFloat(String(tx.amount)), 0);
    const fulfilled = filteredTx.filter((tx) => tx.state === "FULFILL").length;
    const failed = filteredTx.filter((tx) => tx.state === "FAILED" || tx.state === "failed").length;
    const refunded = filteredTx.filter((tx) => tx.state === "refunded").length;
    return { total, fulfilled, failed, refunded, count: filteredTx.length, avg: filteredTx.length ? total / filteredTx.length : 0 };
  }, [filteredTx]);

  // Payment method breakdown
  const txMethodBreakdown = useMemo(() => {
    const map: Record<string, { name: string; count: number; amount: number }> = {};
    filteredTx.forEach((tx) => {
      const method = tx.payment_method || "Unknown";
      if (!map[method]) map[method] = { name: method, count: 0, amount: 0 };
      map[method].count += 1;
      map[method].amount += parseFloat(String(tx.amount));
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [filteredTx]);

  // ─── Filtered & sorted EOD ───────────────────────────────────────────────────
  const filteredEod = useMemo(() => {
    const from = effectiveFrom ? new Date(effectiveFrom).getTime() : 0;
    const to = effectiveTo ? new Date(effectiveTo + "T23:59:59Z").getTime() : Infinity;
    let rows = allEod.filter((e) => {
      const d = new Date(e.report_date).getTime();
      if (d < from || d > to) return false;
      if (eodSearch) {
        const q = eodSearch.toLowerCase();
        if (!String(e.id).includes(q) && !e.report_date.includes(q) && !(e.terminal_name || "").toLowerCase().includes(q)) return false;
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
  }, [allEod, effectiveFrom, effectiveTo, eodSearch, eodSort]);

  // EOD chart data
  const eodChartData = useMemo(() =>
    [...filteredEod]
      .sort((a, b) => a.report_date.localeCompare(b.report_date))
      .map((e) => ({
        date: fmtDate(e.report_date),
        total_amount: parseFloat(String(e.total_amount || 0)),
        total_transactions: e.total_transactions || 0,
        failed_transactions: e.failed_transactions || 0,
      })),
    [filteredEod]
  );

  // EOD KPIs
  const eodKpis = useMemo(() => {
    const totalRev = filteredEod.reduce((s, e) => s + parseFloat(String(e.total_amount || 0)), 0);
    const totalTx = filteredEod.reduce((s, e) => s + (e.total_transactions || 0), 0);
    const totalFailed = filteredEod.reduce((s, e) => s + (e.failed_transactions || 0), 0);
    const avgRev = filteredEod.length ? totalRev / filteredEod.length : 0;
    return { totalRev, totalTx, totalFailed, avgRev, days: filteredEod.length };
  }, [filteredEod]);

  // EOD day-over-day
  const eodWithDelta = useMemo(() => {
    const sorted = [...filteredEod].sort((a, b) => a.report_date.localeCompare(b.report_date));
    return sorted.map((e, i) => {
      const prev = sorted[i - 1];
      const curAmt = parseFloat(String(e.total_amount || 0));
      const prevAmt = prev ? parseFloat(String(prev.total_amount || 0)) : 0;
      const delta = prev && prevAmt > 0 ? ((curAmt - prevAmt) / prevAmt) * 100 : null;
      return { ...e, delta, totalAmountNum: curAmt, avgAmountNum: parseFloat(String(e.avg_amount || 0)) };
    }).reverse();
  }, [filteredEod]);

  // ─── Statistics ───────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const dowRevenue: number[] = Array(7).fill(0);
    const dowCount: number[] = Array(7).fill(0);
    const dowTx: number[] = Array(7).fill(0);
    allEod.forEach((e) => {
      const dow = new Date(e.report_date + "T12:00:00").getDay();
      dowRevenue[dow] += parseFloat(String(e.total_amount || 0));
      dowTx[dow] += e.total_transactions || 0;
      dowCount[dow] += 1;
    });
    const avgRevByDow = dowRevenue.map((r, i) => ({
      day: DAY_SHORT[i],
      avgRevenue: dowCount[i] ? parseFloat((r / dowCount[i]).toFixed(2)) : 0,
      avgTransactions: dowCount[i] ? parseFloat((dowTx[i] / dowCount[i]).toFixed(1)) : 0,
      days: dowCount[i],
    }));

    const byRevSorted = [...avgRevByDow].sort((a, b) => b.avgRevenue - a.avgRevenue);
    const best = byRevSorted[0];
    const worst = byRevSorted[byRevSorted.length - 1];

    const weekdayRev = [1, 2, 3, 4, 5].reduce((s, d) => s + (avgRevByDow[d]?.avgRevenue || 0), 0) / 5;
    const weekendRev = [0, 6].reduce((s, d) => s + (avgRevByDow[d]?.avgRevenue || 0), 0) / 2;

    const dowFailed: number[] = Array(7).fill(0);
    const dowSuccess: number[] = Array(7).fill(0);
    allEod.forEach((e) => {
      const dow = new Date(e.report_date + "T12:00:00").getDay();
      dowFailed[dow] += e.failed_transactions || 0;
      dowSuccess[dow] += e.successful_transactions || 0;
    });
    const failRateByDow = dowFailed.map((f, i) => ({
      day: DAY_SHORT[i],
      failRate: dowSuccess[i] + f > 0 ? parseFloat(((f / (dowSuccess[i] + f)) * 100).toFixed(1)) : 0,
    }));

    const monthMap: Record<string, { month: string; revenue: number; transactions: number; count: number }> = {};
    allEod.forEach((e) => {
      const m = e.report_date.slice(0, 7);
      if (!monthMap[m]) monthMap[m] = { month: m, revenue: 0, transactions: 0, count: 0 };
      monthMap[m].revenue += parseFloat(String(e.total_amount || 0));
      monthMap[m].transactions += e.total_transactions || 0;
      monthMap[m].count += 1;
    });
    const monthlyTrend = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month)).map((m) => ({
      ...m,
      revenue: parseFloat(m.revenue.toFixed(2)),
      label: new Date(m.month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    }));

    return { avgRevByDow, best, worst, weekdayRev, weekendRev, failRateByDow, monthlyTrend };
  }, [allEod]);

  // ── Custom Tooltip ────────────────────────────────────────────────────────────
  function CustomTooltip({
    active, payload, label, yFormatter,
  }: {
    active?: boolean;
    payload?: any[];
    label?: string;
    yFormatter?: (v: number) => string;
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
              {yFormatter ? yFormatter(p.value) : p.value?.toLocaleString()}
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
    const headers = ["ID", "Date", "Customer", "Payment Method", "Status", "Amount"];
    const rows = filteredTx.map((tx) => [
      String(tx.id), tx.created_at, tx.customer_name || "", tx.payment_method || "", tx.state, String(tx.amount),
    ]);
    csvDownload("transactions_report.csv", [headers, ...rows]);
  }
  function exportEodCsv() {
    const headers = ["ID", "Date", "Terminal", "Total Tx", "Success", "Failed", "Total Amount", "Avg Tx"];
    const rows = filteredEod.map((e) => [
      String(e.id), e.report_date, e.terminal_name || "", String(e.total_transactions),
      String(e.successful_transactions), String(e.failed_transactions),
      parseFloat(String(e.total_amount)).toFixed(2), parseFloat(String(e.avg_amount)).toFixed(2),
    ]);
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
  const now = new Date();
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
            {
              label: "Last 7d",
              from: new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10),
              to: now.toISOString().slice(0, 10),
            },
            {
              label: "Last 30d",
              from: new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10),
              to: now.toISOString().slice(0, 10),
            },
            {
              label: "All",
              from: "",
              to: "",
            },
          ].map((p) => (
            <Button key={p.label} variant="outline" size="sm" onClick={() => { setFromDate(p.from); setToDate(p.to); }}>
              {p.label === "Last 7d" ? t("last7d") : p.label === "Last 30d" ? t("last30d") : t("allDatesShort")}
            </Button>
          ))}
          {isHotelMgr && <PropertyFilterSelect />}
        </div>
      </CardContent>
    </Card>
  );

  // ── Status badge helper ───────────────────────────────────────────────────────
  function statusBadge(state: string) {
    const s = state?.toUpperCase();
    if (s === "FULFILL") return <Badge className="bg-green-100 text-green-800">{state}</Badge>;
    if (s === "FAILED") return <Badge className="bg-red-100 text-red-800">{state}</Badge>;
    if (s === "REFUNDED") return <Badge className="bg-orange-100 text-orange-800">{state}</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800">{state}</Badge>;
  }

  // ── Available payment methods from data ───────────────────────────────────────
  const paymentMethods = useMemo(() => {
    const set = new Set(allTx.map((tx) => tx.payment_method).filter(Boolean));
    return Array.from(set) as string[];
  }, [allTx]);

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
              { label: t("fulfilled"), value: txKpis.fulfilled, icon: <CheckCircle className="h-4 w-4 text-green-500" />, color: "text-green-600" },
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
                {(["area", "bar", "line"] as const).map((ct) => (
                  <Button key={ct} size="sm" variant={txChartType === ct ? "default" : "outline"} onClick={() => setTxChartType(ct)} className={txChartType === ct ? "bg-blue-700 text-white" : ""}>
                    {ct.charAt(0).toUpperCase() + ct.slice(1)}
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
                  <SelectTrigger className="w-36"><SelectValue placeholder={t("status")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allStatuses")}</SelectItem>
                    <SelectItem value="FULFILL">{t("fulfilled")}</SelectItem>
                    <SelectItem value="FAILED">{t("failed")}</SelectItem>
                    <SelectItem value="pending">{t("pending")}</SelectItem>
                    <SelectItem value="refunded">{t("refunded")}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={txMethod} onValueChange={setTxMethod}>
                  <SelectTrigger className="w-44"><SelectValue placeholder={t("paymentMethod")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allMethods")}</SelectItem>
                    {paymentMethods.map((m) => (
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
                        { col: "created_at", label: t("date") },
                        { col: "customer_name", label: t("customer") },
                        { col: "payment_method", label: t("paymentMethod") },
                        { col: "state", label: t("status") },
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
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">{t("noTransactionsMatchFilters")}</TableCell></TableRow>
                    ) : filteredTx.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                        <TableCell className="text-sm">{new Date(tx.created_at).toLocaleString()}</TableCell>
                        <TableCell>{tx.customer_name || "—"}</TableCell>
                        <TableCell>{tx.payment_method || "—"}</TableCell>
                        <TableCell>{statusBadge(tx.state)}</TableCell>
                        <TableCell className="font-medium">{fmt(parseFloat(String(tx.amount)))}</TableCell>
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
                    <SelectItem value="total_amount">{t("revenue")}</SelectItem>
                    <SelectItem value="total_transactions">{t("transactions")}</SelectItem>
                    <SelectItem value="failed_transactions">{t("failedTransactions")}</SelectItem>
                  </SelectContent>
                </Select>
                {(["area", "bar", "line"] as const).map((ct) => (
                  <Button key={ct} size="sm" variant={eodChartType === ct ? "default" : "outline"} onClick={() => setEodChartType(ct)} className={eodChartType === ct ? "bg-blue-700 text-white" : ""}>
                    {ct.charAt(0).toUpperCase() + ct.slice(1)}
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
                      color: eodChartMetric === "failed_transactions" ? "#ef4444" : "#3b82f6",
                      label: eodChartMetric === "total_amount" ? `${t("revenue")} ($)` : eodChartMetric === "total_transactions" ? t("transactions") : t("failedTransactions"),
                    }],
                    "date",
                    eodChartMetric === "total_amount" ? (v) => `$${v.toLocaleString()}` : undefined,
                    t("date"),
                    eodChartMetric === "total_amount" ? `${t("revenue")} ($)` : t("count"),
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
                <CardDescription>{filteredEod.length} {t("recordsFound2")}</CardDescription>
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
                        { col: "report_date", label: t("date") },
                        { col: "terminal_name", label: t("terminals") },
                        { col: "total_transactions", label: t("totalTx") },
                        { col: "successful_transactions", label: t("success") },
                        { col: "failed_transactions", label: t("failed") },
                        { col: "total_amount", label: t("revenue") },
                        { col: "avg_amount", label: t("avgTx") },
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
                      <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-10">{t("noRecordsMatch")}</TableCell></TableRow>
                    ) : eodWithDelta.map((e) => {
                      const failRate = (e.total_transactions || 0) > 0 ? ((e.failed_transactions || 0) / (e.total_transactions || 1)) * 100 : 0;
                      return (
                        <TableRow key={e.id}>
                          <TableCell className="font-mono text-xs">EOD-{e.id}</TableCell>
                          <TableCell className="font-medium">{fmtDate(e.report_date)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{e.terminal_name || "—"}</TableCell>
                          <TableCell>{e.total_transactions || 0}</TableCell>
                          <TableCell className="text-green-600">{e.successful_transactions || 0}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              {e.failed_transactions || 0}
                              {failRate > 5 && (
                                <Badge className="bg-red-100 text-red-700 text-xs px-1">{failRate.toFixed(1)}%</Badge>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{fmt(e.totalAmountNum)}</TableCell>
                          <TableCell>{fmt(e.avgAmountNum)}</TableCell>
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
          {allEod.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                No EOD data available yet. Statistics will appear once terminals start pushing end-of-day reports.
              </CardContent>
            </Card>
          ) : (
            <>
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
                    <div className="text-sm text-red-700 mt-0.5">Avg {fmt(stats.worst?.avgRevenue || 0)} / day</div>
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
                  <CardDescription>Based on all available EOD data ({allEod.length} reports)</CardDescription>
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("failureRateByDay")}</CardTitle>
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
              {stats.monthlyTrend.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("monthlyRevenueTrend")}</CardTitle>
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
              )}

              {/* Full breakdown table */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("dayOfWeekBreakdown")}</CardTitle>
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
                        const vsBest = stats.best ? ((d.avgRevenue - stats.best.avgRevenue) / (stats.best.avgRevenue || 1)) * 100 : 0;
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
