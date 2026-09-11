import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartPanel from "../components/common/ChartPanel";
import MetricCard from "../components/common/MetricCard";
import { useAnalytics } from "../context/AnalyticsContext";
import { useTheme } from "../context/ThemeContext";
import { DEPARTMENT_CHART_COLORS, VIBRANT_CHART_COLORS } from "../data/dashboardData";

function SalesAnalyticsPage() {
  const {
    totalSalesRevenue,
    monthlyRevenueTrend,
    salesByDepartment,
    revenueContribution,
    formatters,
  } = useAnalytics();
  const { isDark } = useTheme();

  const targetGapTrend = useMemo(
    () =>
      monthlyRevenueTrend.map((item) => {
        const variance = Number(item.revenue || 0) - Number(item.target || 0);

        return {
          month: item.month,
          surplus: variance > 0 ? variance : 0,
          shortfall: variance < 0 ? Math.abs(variance) : 0,
        };
      }),
    [monthlyRevenueTrend]
  );

  const averageMonthlyRevenue =
    monthlyRevenueTrend.length === 0
      ? 0
      : monthlyRevenueTrend.reduce((sum, item) => sum + item.revenue, 0) / monthlyRevenueTrend.length;

  const revenueTotal = monthlyRevenueTrend.reduce((sum, item) => sum + item.revenue, 0);
  const targetTotal = monthlyRevenueTrend.reduce((sum, item) => sum + item.target, 0);
  const targetAttainment = targetTotal === 0 ? 0 : (revenueTotal / targetTotal) * 100;

  const renderRevenueTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) {
      return null;
    }

    const point = payload[0];
    const color = point.color || "#22d3ee";
    const label = point.name || point.payload?.department || "Department";
    const value = Number(point.value || 0);

    return (
      <div
        style={{
          background: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.97)",
          border: isDark
            ? "1px solid rgba(100, 116, 139, 0.65)"
            : "1px solid rgba(148, 163, 184, 0.45)",
          borderRadius: "10px",
          boxShadow: isDark
            ? "0 10px 30px rgba(2, 6, 23, 0.44)"
            : "0 10px 28px rgba(15, 23, 42, 0.12)",
          color: isDark ? "#e2e8f0" : "#0f172a",
          padding: "0.55rem 0.7rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
          <span
            style={{
              width: "9px",
              height: "9px",
              borderRadius: "999px",
              background: color,
              display: "inline-block",
            }}
          />
          <span style={{ fontWeight: 600 }}>{label}:</span>
          <span style={{ fontWeight: 700 }}>{formatters.currency(value)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[1700px] space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Total Sales Revenue"
          value={formatters.currency(totalSalesRevenue)}
          icon="monitoring"
          trend="+8.7%"
          trendPositive
          comparison="vs previous period"
        />

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Average Monthly Revenue</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatters.currency(averageMonthlyRevenue)}</p>
          <p className="mt-4 text-xs text-slate-500">Calculated from selected date range</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Revenue Target Attainment</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{targetAttainment.toFixed(1)}%</p>
          <p className="mt-4 text-xs text-slate-500">Compared against monthly target baseline</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartPanel title="Monthly Revenue Trend" subtitle="Revenue trend over selected period" requiresDataset>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRevenueTrend} margin={{ top: 10, right: 20, left: 0, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatters.compactCurrency(value)} />
                <Tooltip formatter={(value) => formatters.currency(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#14b8a6"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#f97316"
                  strokeDasharray="6 4"
                  strokeWidth={2}
                  dot={false}
                  name="Target"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="Sales by Department" subtitle="Annualized revenue contribution by department" requiresDataset>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByDepartment} margin={{ top: 10, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(value) => formatters.compactCurrency(value)} />
                <Tooltip formatter={(value) => formatters.currency(value)} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {salesByDepartment.map((item, index) => (
                    <Cell
                      key={`sales-by-dept-${item.department}`}
                      fill={VIBRANT_CHART_COLORS[index % VIBRANT_CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartPanel title="Revenue Contribution" subtitle="Share of revenue by department" requiresDataset>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueContribution}
                  dataKey="revenue"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  outerRadius={96}
                  innerRadius={52}
                  paddingAngle={2}
                >
                  {revenueContribution.map((item, index) => (
                    <Cell
                      key={item.department}
                      fill={DEPARTMENT_CHART_COLORS[index % DEPARTMENT_CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={renderRevenueTooltip} />
                <Legend verticalAlign="bottom" height={24} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel
          title="Target Gap Analysis"
          subtitle="Monthly surplus and shortfall relative to target"
          requiresDataset
        >
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={targetGapTrend} margin={{ top: 10, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatters.compactCurrency(value)} />
                <Tooltip formatter={(value) => formatters.currency(value)} />
                <Legend />
                <Bar dataKey="surplus" fill="#10b981" radius={[6, 6, 0, 0]} name="Surplus" />
                <Bar dataKey="shortfall" fill="#f97316" radius={[6, 6, 0, 0]} name="Shortfall" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
      </section>
    </div>
  );
}

export default SalesAnalyticsPage;
