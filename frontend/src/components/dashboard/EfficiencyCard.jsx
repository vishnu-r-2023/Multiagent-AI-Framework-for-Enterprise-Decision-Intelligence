import { memo, useMemo } from "react";

function EfficiencyCard({ departments }) {
  const average = useMemo(
    () =>
      Math.round(
        departments.reduce((total, department) => total + department.score, 0) /
          departments.length
      ),
    [departments]
  );

  return (
    <section className="glass-card flex flex-col rounded-3xl border border-white/40 p-6 sm:p-8">
      <h3 className="mb-8 text-xl font-bold text-slate-900">
        Department Efficiency
      </h3>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative h-48 w-48">
          <svg className="h-full w-full" viewBox="0 0 36 36">
            <path
              className="text-slate-100"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="text-primary"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={`${average}, 100`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-900">{average}%</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">
              Avg. Performance
            </span>
          </div>
        </div>

        <div className="mt-8 w-full space-y-4">
          {departments.map((department) => (
            <div
              key={department.name}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-3 w-3 rounded-full ${department.colorClass}`}
                />
                <span className="text-sm font-medium text-slate-600">
                  {department.name}
                </span>
              </div>
              <span className="text-sm font-bold text-slate-900">
                {department.score}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(EfficiencyCard);
