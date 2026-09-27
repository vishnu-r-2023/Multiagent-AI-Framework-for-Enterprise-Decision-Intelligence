import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartPanel from "../components/common/ChartPanel";
import MetricCard from "../components/common/MetricCard";
import { useAnalytics } from "../context/AnalyticsContext";
import { VIBRANT_CHART_COLORS } from "../data/dashboardData";

function FinanceOverviewPage() {
  const {
    financeKpis,
    financeRevenueExpensesTrend,
    budgetAllocationByDepartment,
    formatters,
  } = useAnalytics();

  return (
    <div className="mx-auto max-w-[1700px] space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Total Revenue"
          value={formatters.currency(financeKpis.revenue)}
          icon="currency_rupee"
          trend="+6.2%"
          trendPositive
          comparison="vs previous period"
        />

        <MetricCard
          title="Total Expenses"
          value={formatters.currency(financeKpis.expenses)}
          icon="account_balance_wallet"
          trend="+2.3%"
          trendPositive={false}
          comparison="vs previous period"
        />

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Profit Margin</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{financeKpis.profitMargin.toFixed(1)}%</p>
          <p className="mt-4 text-xs text-slate-500">Net Profit: {formatters.currency(financeKpis.netProfit)}</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartPanel title="Revenue vs Expenses" subtitle="Monthly comparison of revenue and expense trends" requiresDataset>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={financeRevenueExpensesTrend}
                margin={{ top: 10, right: 20, left: 0, bottom: 6 }}
              >
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
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  name="Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="Profit Margin Trend" subtitle="Profit margin movement across selected period" requiresDataset>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financeRevenueExpensesTrend} margin={{ top: 10, right: 20, left: 0, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" />
                <YAxis unit="%" />
                <Tooltip formatter={(value) => `${value}%`} />
                <Area
                  type="monotone"
                  dataKey="profitMargin"
                  stroke="#a855f7"
                  fill="#e9d5ff"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
      </section>

      <section>
        <ChartPanel
          title="Budget Allocation by Department"
          subtitle="Stacked allocation of personnel, training, and operations budgets (in thousands)"
          requiresDataset
        >
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetAllocationByDepartment} margin={{ top: 10, right: 16, left: 12, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis unit="K" />
                <Tooltip formatter={(value) => `${value}K`} />
                <Legend />
                <Bar dataKey="personnelBudgetK" stackId="budget" fill="#10b981" name="Personnel" />
                <Bar dataKey="trainingBudgetK" stackId="budget" fill="#f59e0b" name="Training" />
                <Bar dataKey="operationsBudgetK" stackId="budget" name="Operations">
                  {budgetAllocationByDepartment.map((item, index) => (
                    <Cell
                      key={`operations-${item.department}`}
                      fill={VIBRANT_CHART_COLORS[(index + 2) % VIBRANT_CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
      </section>
    </div>
  );
}

export default FinanceOverviewPage;
