import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartPanel from "../components/common/ChartPanel";
import { useAnalytics } from "../context/AnalyticsContext";
import { VIBRANT_CHART_COLORS } from "../data/dashboardData";

function EmployeePerformancePage() {
  const {
    performanceRatingDistribution,
    jobSatisfactionLevels,
    workLifeBalanceLevels,
    departmentPerformanceComparison,
    radarPerformanceIndicators,
    leaderboardRows,
  } = useAnalytics();

  return (
    <div className="mx-auto max-w-[1700px] space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartPanel
          title="Radar: Employee Performance Indicators"
          subtitle="Balanced view of productivity, engagement, and retention"
          requiresDataset
        >
          <div className="h-[330px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarPerformanceIndicators} outerRadius="78%">
                <PolarGrid stroke="#dbeafe" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 120]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#14b8a6"
                  fill="#a855f7"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel
          title="Department Productivity Comparison"
          subtitle="Productivity score derived from average performance ratings"
          requiresDataset
        >
          <div className="h-[330px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentPerformanceComparison}
                margin={{ top: 10, right: 16, left: -10, bottom: 6 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="productivity" radius={[6, 6, 0, 0]}>
                  {departmentPerformanceComparison.map((item, index) => (
                    <Cell
                      key={`dept-productivity-${item.department}`}
                      fill={VIBRANT_CHART_COLORS[index % VIBRANT_CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartPanel title="Performance Rating Distribution" subtitle="Rounded ratings by employee count" requiresDataset>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceRatingDistribution} margin={{ top: 8, right: 16, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="rating" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="employees" radius={[6, 6, 0, 0]}>
                  {performanceRatingDistribution.map((item, index) => (
                    <Cell
                      key={`rating-${item.rating}`}
                      fill={VIBRANT_CHART_COLORS[(index + 1) % VIBRANT_CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="Job Satisfaction Levels" subtitle="Employee sentiment across scores" requiresDataset>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={jobSatisfactionLevels} margin={{ top: 8, right: 16, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="score" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="employees" radius={[6, 6, 0, 0]}>
                  {jobSatisfactionLevels.map((item, index) => (
                    <Cell
                      key={`satisfaction-${item.score}`}
                      fill={VIBRANT_CHART_COLORS[(index + 3) % VIBRANT_CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel title="Work-Life Balance Scores" subtitle="Distribution of work-life scores" requiresDataset>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workLifeBalanceLevels} margin={{ top: 8, right: 16, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="score" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="employees" radius={[6, 6, 0, 0]}>
                  {workLifeBalanceLevels.map((item, index) => (
                    <Cell
                      key={`worklife-${item.score}`}
                      fill={VIBRANT_CHART_COLORS[(index + 5) % VIBRANT_CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
      </section>

      <section>
        <ChartPanel
          title="Top Performing Employees"
          subtitle="Leaderboard ranked by performance, satisfaction, and work-life balance"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-3 py-3 font-semibold">Employee ID</th>
                  <th className="px-3 py-3 font-semibold">Job Role</th>
                  <th className="px-3 py-3 font-semibold">Department</th>
                  <th className="px-3 py-3 font-semibold">Performance Rating</th>
                  <th className="px-3 py-3 font-semibold">Job Satisfaction Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardRows.map((employee) => (
                  <tr key={employee.employeeId} className="border-b border-slate-100 text-sm text-slate-700">
                    <td className="px-3 py-3 font-semibold text-slate-900">{employee.employeeId}</td>
                    <td className="px-3 py-3">{employee.jobRole}</td>
                    <td className="px-3 py-3">{employee.department}</td>
                    <td className="px-3 py-3">{employee.performanceRating.toFixed(2)}</td>
                    <td className="px-3 py-3">{employee.jobSatisfaction.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartPanel>
      </section>
    </div>
  );
}

export default EmployeePerformancePage;
