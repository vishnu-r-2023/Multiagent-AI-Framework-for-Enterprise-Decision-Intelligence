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
import { VIBRANT_CHART_COLORS, DEPARTMENT_CHART_COLORS } from "../data/dashboardData";

function MarketingAnalyticsPage() {
  const {
    totalLeads,
    totalMarketingRevenue,
    marketingTrend,
    leadsByChannel,
    marketingChannelReturn,
    revenueByCampaign,
    formatters,
  } = useAnalytics();
  const { isDark } = useTheme();

  const averageCTR =
    marketingTrend.length === 0
      ? 0
      : marketingTrend.reduce((sum, item) => sum + item.ctr, 0) /
        marketingTrend.length;

  const renderTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;

    const point = payload[0];
    const label = point.name || point.payload?.campaign || "Campaign";
    const value = Number(point.value || 0);
    const color = point.color || "#22d3ee";

    return (
      <div
        style={{
          background: isDark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.97)",
          border: isDark
            ? "1px solid rgba(100,116,139,0.65)"
            : "1px solid rgba(148,163,184,0.45)",
          borderRadius: "10px",
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

      {/* KPI CARDS */}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

        <MetricCard
          title="Total Leads Generated"
          value={formatters.number(totalLeads)}
          icon="trending_up"
          trend="+12.5%"
          trendPositive
          comparison="vs previous period"
        />

        <MetricCard
          title="Marketing Revenue"
          value={formatters.currency(totalMarketingRevenue)}
          icon="currency_rupee"
          trend="+9.2%"
          trendPositive
          comparison="vs previous period"
        />

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Average Click Through Rate
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {averageCTR.toFixed(2)}%
          </p>

          <p className="mt-4 text-xs text-slate-500">
            Based on impressions and clicks
          </p>
        </article>

      </section>

      {/* MARKETING TREND */}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">

        <ChartPanel
          title="Marketing Performance Trend"
          subtitle="Leads generated over time"
          requiresDataset
        >
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marketingTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

                <XAxis dataKey="month" />

                <YAxis />

                <Tooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="#22c55e"
                  strokeWidth={3}
                  name="Leads"
                />

                <Line
                  type="monotone"
                  dataKey="visitors"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Website Visitors"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        {/* LEADS BY CHANNEL */}

        <ChartPanel
          title="Leads by Marketing Channel"
          subtitle="Performance across channels"
          requiresDataset
        >
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsByChannel}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis dataKey="channel" />

                <YAxis />

                <Tooltip />

                <Bar dataKey="leads" radius={[6, 6, 0, 0]}>
                  {leadsByChannel.map((item, index) => (
                    <Cell
                      key={item.channel}
                      fill={
                        VIBRANT_CHART_COLORS[
                          index % VIBRANT_CHART_COLORS.length
                        ]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

      </section>

      {/* CAMPAIGN REVENUE */}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">

        <ChartPanel
          title="Revenue Contribution by Campaign"
          subtitle="Campaign revenue distribution"
          requiresDataset
        >
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>

                <Pie
                  data={revenueByCampaign}
                  dataKey="revenue"
                  nameKey="campaign"
                  cx="50%"
                  cy="50%"
                  outerRadius={96}
                  innerRadius={52}
                >
                  {revenueByCampaign.map((item, index) => (
                    <Cell
                      key={item.campaign}
                      fill={
                        DEPARTMENT_CHART_COLORS[
                          index % DEPARTMENT_CHART_COLORS.length
                        ]
                      }
                    />
                  ))}
                </Pie>

                <Tooltip content={renderTooltip} />

                <Legend verticalAlign="bottom" height={24} />

              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel
          title="Channel Spend vs Revenue"
          subtitle="Compare investment and return across channels"
          requiresDataset
        >
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marketingChannelReturn}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="channel" />
                <YAxis tickFormatter={(value) => formatters.compactCurrency(value)} />
                <Tooltip formatter={(value) => formatters.currency(value)} />
                <Legend />
                <Bar dataKey="spend" fill="#8b5cf6" name="Spend" radius={[6, 6, 0, 0]} />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

      </section>

    </div>
  );
}

export default MarketingAnalyticsPage;
