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
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle,
  Download,
  Eye,
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

const COLORS = ['hsl(218, 89%, 51%)', 'hsl(28, 95%, 58%)', '#8884d8', '#82ca9d', '#ffc658'];
export default function Home() {
  const { user } = useAuth();
  const changePercentage = ((mockKPIs.todayRevenue - mockKPIs.yesterdayRevenue) / mockKPIs.yesterdayRevenue * 100);
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Payment Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}. Here's your hotel's payment overview.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </div>
      <PageMeta
        title="React.js Transactions Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is the Transactions Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
        <KPICard
          title="Today's Revenue"
          value={`$${mockKPIs.todayRevenue.toLocaleString()}`}
          change={{ value: Math.round(changePercentage), type: changePercentage > 0 ? "increase" : "decrease" }}
          icon={DollarSign}
          description="Compared to yesterday"
        />
        <KPICard
          title="Month to Date"
          value={`$${mockKPIs.monthToDate.toLocaleString()}`}
          change={{ value: 12, type: "increase" }}
          icon={TrendingUp}
          description="This month's total"
        />
        <KPICard
          title="Avg Transaction"
          value={`$${mockKPIs.averageTransactionValue}`}
          change={{ value: 5, type: "increase" }}
          icon={CreditCard}
          description="Per transaction"
        />
        <KPICard
          title="Failed Transactions"
          value={`${mockKPIs.failedTransactionsCount}`}
          icon={AlertTriangle}
          description={`$${mockKPIs.failedTransactionsValue} in value`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2 mb-5">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (Last 7 Days)</CardTitle>
            <CardDescription>Daily revenue and transaction volume</CardDescription>
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
                    name === 'revenue' ? 'Revenue' : 'Transactions'
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
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Distribution by card brand and digital wallets</CardDescription>
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
          <CardTitle>Performance by Location</CardTitle>
          <CardDescription>Transaction volume and revenue by hotel location</CardDescription>
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
                  name === 'revenue' ? 'Revenue' : 'Transactions'
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