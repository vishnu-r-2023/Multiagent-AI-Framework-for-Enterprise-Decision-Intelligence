import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import ChartPanel from "../components/common/ChartPanel";
import MetricCard from "../components/common/MetricCard";
import { useAnalytics } from "../context/AnalyticsContext";
import { DEPARTMENT_CHART_COLORS, VIBRANT_CHART_COLORS } from "../data/dashboardData";

function OverviewPage() {
  const {
    kpiCards,
    departmentDistribution,
    attritionByDepartment,
    ageDistribution,
    salaryDistribution,
    experienceVsPerformance,
    ppfFrontier,
  } = useAnalytics();

  return (
    <div className="mx-auto max-w-[1700px] space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpiCards.map((item) => (
          <MetricCard
            key={item.key}
            title={item.title}
            value={item.value}
            icon={item.icon}
            trend={item.trend}
            trendPositive={item.trendPositive}
            comparison={item.comparison}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartPanel title="Department Distribution" subtitle="Employees by department" requiresDataset>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentDistribution}
                  dataKey="count"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  outerRadius={92}
                  innerRadius={52}
                  paddingAngle={2}
                >
                  {departmentDistribution.map((entry, index) => (
                    <Cell
                      key={entry.department}
                      fill={DEPARTMENT_CHART_COLORS[index % DEPARTMENT_CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={24} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="Attrition Analysis" subtitle="Attrition count by department" requiresDataset>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attritionByDepartment} margin={{ top: 10, right: 16, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="attritionCount" radius={[6, 6, 0, 0]}>
                  {attritionByDepartment.map((item, index) => (
                    <Cell
                      key={`attrition-${item.department}`}
                      fill={VIBRANT_CHART_COLORS[index % VIBRANT_CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="Employee Age Distribution" subtitle="Histogram across age groups" requiresDataset>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageDistribution} margin={{ top: 10, right: 16, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="ageGroup" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="employees" radius={[6, 6, 0, 0]}>
                  {ageDistribution.map((item, index) => (
                    <Cell
                      key={`age-${item.ageGroup}`}
                      fill={VIBRANT_CHART_COLORS[(index + 2) % VIBRANT_CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="Salary Distribution" subtitle="Monthly income bands" requiresDataset>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryDistribution} margin={{ top: 10, right: 16, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="range" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="employees" radius={[6, 6, 0, 0]}>
                  {salaryDistribution.map((item, index) => (
                    <Cell
                      key={`salary-${item.range}`}
                      fill={VIBRANT_CHART_COLORS[(index + 4) % VIBRANT_CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartPanel
          title="PPF Curve (Production Possibility Frontier)"
          subtitle="Trade-off between HR capability and business output under current resources"
        >
          {ppfFrontier.hasData ? (
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={ppfFrontier.frontierData}
                  margin={{ top: 10, right: 24, left: 0, bottom: 8 }}
                >
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="hrCapability"
                    name="HR Capability"
                    domain={[0, Math.ceil(ppfFrontier.hrMax)]}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="businessOutput"
                    name="Business Output"
                    domain={[0, Math.ceil(ppfFrontier.businessMax)]}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => Number(value).toFixed(1)}
                    labelFormatter={(value) => `HR Capability: ${Number(value).toFixed(1)}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="businessOutput"
                    stroke="#a855f7"
                    strokeWidth={3}
                    dot={{ r: 2 }}
                    name="PPF Frontier"
                  />
                  <Scatter
                    data={ppfFrontier.operatingPoint}
                    fill="#f97316"
                    name="Current Position"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[340px] items-center justify-center text-center text-sm text-slate-500">
              Upload a dataset to view the PPF curve.
            </div>
          )}
        </ChartPanel>

        <ChartPanel
          title="Experience vs Performance"
          subtitle="Scatter plot of years of experience against performance rating"
          requiresDataset
        >
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 24, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="yearsExperience"
                  name="Years Experience"
                  unit=" yrs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  domain={[1, 5]}
                  dataKey="performanceRating"
                  name="Performance"
                  tick={{ fontSize: 12 }}
                />
                <ZAxis type="number" dataKey="monthlyIncome" range={[60, 420]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={experienceVsPerformance} fill="#f97316" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
      </section>
    </div>
  );
}

export default OverviewPage;
