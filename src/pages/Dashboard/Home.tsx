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
import { mockKPIs, mockPaymentMethodsData, mockRevenueData, mockLocationData } from "../../data/mockData";
import AuthService from "../../services/authService";
import { useNavigate } from "react-router-dom";
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

const COLORS = ['hsl(218, 89%, 51%)', 'hsl(28, 95%, 58%)', '#8884d8', '#82ca9d', '#ffc658'];
export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const canGenerateReports = hasPermission(user?.role, APP_PERMISSIONS.GENERATE_REPORTS);
  const changePercentage = ((mockKPIs.todayRevenue - mockKPIs.yesterdayRevenue) / mockKPIs.yesterdayRevenue * 100);

  const [mfaDisabled, setMfaDisabled] = useState(false);
  const [mfaBannerDismissed, setMfaBannerDismissed] = useState(false);

  useEffect(() => {
    AuthService.getMfaStatus()
      .then((status) => {
        if (!status.mfaEnabled) setMfaDisabled(true);
      })
      .catch(() => {});
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
          title={t("todayRevenue")}
          value={`$${mockKPIs.todayRevenue.toLocaleString()}`}
          change={{ value: Math.round(changePercentage), type: changePercentage > 0 ? "increase" : "decrease" }}
          icon={DollarSign}
          description={t("comparedToYesterday")}
        />
        <KPICard
          title={t("monthToDate")}
          value={`$${mockKPIs.monthToDate.toLocaleString()}`}
          change={{ value: 12, type: "increase" }}
          icon={TrendingUp}
          description={t("thisMonthTotal")}
        />
        <KPICard
          title={t("avgTransaction")}
          value={`$${mockKPIs.averageTransactionValue}`}
          change={{ value: 5, type: "increase" }}
          icon={CreditCard}
          description={t("perTransaction")}
        />
        <KPICard
          title={t("failedTransactions")}
          value={`${mockKPIs.failedTransactionsCount}`}
          icon={AlertTriangle}
          description={`$${mockKPIs.failedTransactionsValue} ${t("inValue")}`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2 mb-5">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>{t("revenueTrend")}</CardTitle>
            <CardDescription>{t("dailyRevenueVolume")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value, name) => [
                    name === 'revenue' ? `$${value.toLocaleString()}` : value,
                    name === 'revenue' ? t("revenue") : t("transactions")
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(218, 89%, 51%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(218, 89%, 51%)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t("paymentMethods")}</CardTitle>
            <CardDescription>{t("distributionByCard")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockPaymentMethodsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockPaymentMethodsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}%`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Location Performance */}
      <Card>
        <CardHeader>
          <CardTitle>{t("performanceByLocation")}</CardTitle>
          <CardDescription>{t("transactionVolumeByLocation")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockLocationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="location" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  name === 'revenue' ? `$${value.toLocaleString()}` : value,
                  name === 'revenue' ? t("revenue") : t("transactions")
                ]}
              />
              <Bar dataKey="transactions" fill="hsl(28, 95%, 58%)" name="transactions" />
              <Bar dataKey="revenue" fill="hsl(218, 89%, 51%)" name="revenue" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>



      <div className="grid-cols-12 gap-4 md:gap-6 hidden">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <TransactionMetrics />

          {/* ✅ Fix: Ensure TransactionsChart gets visible height */}
          <div className="bg-white rounded-xl shadow p-4">
            <TransactionsChart />
          </div>
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        <div className="col-span-12">
          {/* ✅ Fix: Ensure StatisticsChart gets visible height */}
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
