import { useEffect, useState } from "react";
import TransactionMetrics from "../../components/ecommerce/TransactionMetrics";
import TransactionsChart from "../../components/ecommerce/TransactionsChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import { Button } from "../../components/ui/button";
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
  Download,
  Eye,
  ShieldAlert,
  X,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { APP_PERMISSIONS, hasPermission } from "../../lib/permissions";
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
  const canGenerateReports = hasPermission(user?.role, APP_PERMISSIONS.GENERATE_REPORTS);

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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{t("paymentDashboard")}</h1>
          <p className="text-muted-foreground">{`${t("welcomeBack")}, ${user?.name}. ${t("hotelPaymentOverview")}`}</p>
        </div>
        {canGenerateReports && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {t("exportReport")}
            </Button>
            <Button size="sm" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
              <Eye className="h-4 w-4 mr-2" />
              {t("viewDetails")}
            </Button>
          </div>
        )}
      </div>
      <PageMeta
        title="SP Dashboard"
        description="Success Payment Dashboard"
      />

      {/* MFA Warning Banner */}
      {mfaDisabled && !mfaBannerDismissed && (
        <div className="flex items-center justify-between gap-3 mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0" />
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
        <CardContent>
          {dailyStats.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              No transaction data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
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
