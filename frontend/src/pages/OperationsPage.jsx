import {
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

function OperationsPage() {
  const {
    operationsKpis,
    operationsRecords,
    operationsTrend,
    filteredOperationsRecords,
    processUtilization,
    operationsQualityByDepartment,
    backlogInventoryTrend,
    operationsProcessTable,
    formatters,
  } = useAnalytics();

  const hasOperationsDataset = operationsRecords.length > 0;
  const hasFilteredOperations = filteredOperationsRecords.length > 0;

  const emptyState = (
    <div className="flex h-[320px] items-center justify-center text-center text-sm text-slate-500">
      {hasOperationsDataset
        ? "No operations records match the current search, department, and date filters."
        : "Upload an enterprise workbook with an Operations sheet to view operations analytics."}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1700px] space-y-6 p-4 sm:p-6 lg:p-8">
      {hasOperationsDataset && !hasFilteredOperations ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The uploaded dataset includes Operations records, but the current filters exclude them. Reset the
          department, search, or date range to view the latest upload.
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Units Processed"
          value={formatters.number(operationsKpis.totalUnitsProcessed)}
          icon="inventory_2"
          trend="+7.1%"
          trendPositive
          comparison="vs previous period"
        />

        <MetricCard
          title="Operating Cost"
          value={formatters.currency(operationsKpis.totalOperatingCost)}
          icon="manufacturing"
          trend="+2.8%"
          trendPositive={false}
          comparison="vs previous period"
        />

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Average Utilization
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {operationsKpis.averageUtilizationPct.toFixed(1)}%
          </p>
          <p className="mt-4 text-xs text-slate-500">
            Based on filtered operations capacity
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            On-Time Delivery
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {operationsKpis.averageOnTimeDeliveryPct.toFixed(1)}%
          </p>
          <p className="mt-4 text-xs text-slate-500">
            Avg cycle time: {operationsKpis.averageCycleTimeMinutes.toFixed(1)} min
          </p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartPanel
          title="Operations Trend"
          subtitle="Units processed and throughput across the selected date range"
          requiresDataset
        >
          {hasFilteredOperations ? (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={operationsTrend} margin={{ top: 10, right: 20, left: 0, bottom: 6 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="unitsProcessed"
                    stroke="#0f766e"
                    strokeWidth={3}
                    name="Units Processed"
                  />
                  <Line
                    type="monotone"
                    dataKey="throughput"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    name="Throughput"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            emptyState
          )}
        </ChartPanel>

        <ChartPanel
          title="Process Utilization"
          subtitle="Average utilization by process"
          requiresDataset
        >
          {hasFilteredOperations ? (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processUtilization} margin={{ top: 10, right: 16, left: -4, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="processName" tick={{ fontSize: 11 }} />
                  <YAxis unit="%" />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="utilizationPct" radius={[6, 6, 0, 0]}>
                    {processUtilization.map((item, index) => (
                      <Cell
                        key={`process-utilization-${item.processName}`}
                        fill={VIBRANT_CHART_COLORS[index % VIBRANT_CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            emptyState
          )}
        </ChartPanel>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartPanel
          title="Service Quality by Department"
          subtitle="On-time delivery, SLA compliance, and defect rates"
          requiresDataset
        >
          {hasFilteredOperations ? (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={operationsQualityByDepartment}
                  margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar dataKey="onTimeDeliveryPct" fill="#10b981" name="On-Time Delivery" />
                  <Bar dataKey="slaCompliancePct" fill="#3b82f6" name="SLA Compliance" />
                  <Bar dataKey="defectRatePct" fill="#f97316" name="Defect Rate" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            emptyState
          )}
        </ChartPanel>

        <ChartPanel
          title="Backlog vs Inventory"
          subtitle="Monthly operational load compared with inventory levels"
          requiresDataset
        >
          {hasFilteredOperations ? (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={backlogInventoryTrend} margin={{ top: 10, right: 20, left: 0, bottom: 6 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="backlogVolume"
                    stroke="#dc2626"
                    strokeWidth={2.5}
                    name="Backlog"
                  />
                  <Line
                    type="monotone"
                    dataKey="inventoryLevel"
                    stroke="#7c3aed"
                    strokeWidth={2.5}
                    name="Inventory"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            emptyState
          )}
        </ChartPanel>
      </section>

      <section>
        <ChartPanel
          title="Process Efficiency Snapshot"
          subtitle="Top filtered processes by units processed"
          requiresDataset
        >
          {hasFilteredOperations ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-3 py-3 font-semibold">Process</th>
                    <th className="px-3 py-3 font-semibold">Shift</th>
                    <th className="px-3 py-3 font-semibold">Units Processed</th>
                    <th className="px-3 py-3 font-semibold">Utilization</th>
                    <th className="px-3 py-3 font-semibold">Defect Rate</th>
                    <th className="px-3 py-3 font-semibold">Downtime</th>
                  </tr>
                </thead>
                <tbody>
                  {operationsProcessTable.map((item) => (
                    <tr
                      key={`${item.processName}-${item.shift}`}
                      className="border-b border-slate-100 text-sm text-slate-700"
                    >
                      <td className="px-3 py-3 font-medium text-slate-900">{item.processName}</td>
                      <td className="px-3 py-3">{item.shift}</td>
                      <td className="px-3 py-3">{formatters.number(item.unitsProcessed)}</td>
                      <td className="px-3 py-3">{item.utilizationPct.toFixed(1)}%</td>
                      <td className="px-3 py-3">{item.defectRatePct.toFixed(2)}%</td>
                      <td className="px-3 py-3">{formatters.number(item.downtimeMinutes)} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-[240px] items-center justify-center text-center text-sm text-slate-500">
              {hasOperationsDataset
                ? "No operations records match the current search, department, and date filters."
                : "Upload an enterprise workbook with an Operations sheet to view process efficiency details."}
            </div>
          )}
        </ChartPanel>
      </section>
    </div>
  );
}

export default OperationsPage;
