import { useEffect, useState } from "react";
import TransactionMetrics from "../../components/ecommerce/TransactionMetrics";
import TransactionsChart from "../../components/ecommerce/TransactionsChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import { KPICard } from "../../components/dashboard/KPICard";
import AuthService from "../../services/authService";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  X,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { useLanguage } from "../../context/LanguageContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const COLORS = ['hsl(218, 89%, 51%)', 'hsl(28, 95%, 58%)', '#8884d8', '#82ca9d', '#ffc658'];

export default function Home() {
  const { user } = useAuth();
  console.log("👤 User role:", user?.role);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [mfaDisabled, setMfaDisabled] = useState(false);
  const [mfaBannerDismissed, setMfaBannerDismissed] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState<any[]>([]);

 useEffect(() => {
  AuthService.getMfaStatus()
    .then((status) => {
      if (!status.mfaEnabled) setMfaDisabled(true);
    })
    .catch(() => {});
}, []);

useEffect(() => {
  const fetchData = () => {
    console.log(" Refresh automatique - " + new Date().toLocaleTimeString()); 
    
    const token = AuthService.getAccessToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    axios.get(`${API_BASE_URL}/dashboard/overview`, { headers })
      .then((r) => setOverview(r.data))
      .catch(() => {});
    
    axios.get(`${API_BASE_URL}/dashboard/stats`, { headers })
      .then((r) => setDailyStats(r.data || []))
      .catch(() => {});
  };

  fetchData();
  
  const interval = setInterval(fetchData, 60000);
  
  return () => clearInterval(interval);
}, []);

  return (
    <>
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">{t("paymentDashboard")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{`${t("welcomeBack")}, ${user?.name}. ${t("hotelPaymentOverview")}`}</p>
      </div>
      <PageMeta
        title="SP Dashboard"
        description="Success Payment Dashboard"
      />

      {/* MFA Warning Banner */}
      {mfaDisabled && !mfaBannerDismissed && (
        <div className="flex items-start justify-between gap-3 mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <div className="flex items-start gap-3 min-w-0">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">
              {t("mfaWarning")}{" "}
              <button
                onClick={() => navigate("/profile")}
                className="underline underline-offset-2 hover:no-underline font-semibold"
              >
                {t("enableMfa")}
              </button>
            </p>
          </div>
          <button
            onClick={() => setMfaBannerDismissed(true)}
            className="shrink-0 rounded p-1 hover:bg-amber-100 dark:hover:bg-amber-900"
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
        <KPICard
          title={t("totalRevenue")}
          value={overview ? `$${parseFloat(overview.transactions?.total_revenue || 0).toLocaleString()}` : "—"}
          icon={DollarSign}
          description={t("thisMonthTotal")}
        />
        <KPICard
          title={t("totalTransactions")}
          value={overview ? String(overview.transactions?.total_transactions || 0) : "—"}
          icon={TrendingUp}
          description={t("comparedToYesterday")}
        />
        <KPICard
          title={t("activeTerminals")}
          value={overview ? `${overview.terminals?.active || 0} / ${overview.terminals?.total || 0}` : "—"}
          icon={CreditCard}
          description={t("perTransaction")}
        />
        <KPICard
          title={t("failedTransactions")}
          value={overview ? String(overview.transactions?.failed || 0) : "—"}
          icon={AlertTriangle}
          description={t("inValue")}
        />
      </div>

      {/* Revenue Trend Chart */}
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>{t("revenueTrend")}</CardTitle>
          <CardDescription>{t("dailyRevenueVolume")}</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {dailyStats.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              No transaction data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dailyStats} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: any, name: any) => [
                    name === 'total' ? `$${parseFloat(String(value)).toLocaleString()}` : value,
                    name === 'total' ? t("revenue") : t("transactions")
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(218, 89%, 51%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(218, 89%, 51%)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>



      <div className="grid-cols-12 gap-4 md:gap-6 hidden">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <TransactionMetrics />

          {/*  Fix: Ensure TransactionsChart gets visible height */}
          <div className="bg-white rounded-xl shadow p-4">
            <TransactionsChart />
          </div>
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        <div className="col-span-12">
          {/*  Fix: Ensure StatisticsChart gets visible height */}
          <div className="bg-white rounded-xl shadow p-4">
            <StatisticsChart />
          </div>
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders />
        </div>
      </div>
    </>
  );
}
