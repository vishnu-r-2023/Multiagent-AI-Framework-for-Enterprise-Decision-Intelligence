import { memo } from "react";

const toneClassByType = {
  primary: "bg-primary",
  mid: "bg-primary/60",
  light: "bg-primary/30",
};

function BudgetAllocationCard({ budget }) {
  return (
    <section className="glass-card flex flex-col rounded-xl p-8 shadow-sm">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h4 className="text-lg font-bold">Budget Allocation</h4>
          <p className="text-sm text-slate-500">Utilization across departments</p>
        </div>
        <button className="text-slate-400">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-around gap-8 sm:flex-row">
        <div className="relative h-52 w-52">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              strokeWidth="4"
              className="stroke-slate-100"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${budget.utilization} 100`}
              className="stroke-primary"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black">{budget.utilization}%</span>
            <span className="text-[10px] font-bold uppercase text-slate-500">
              Utilized
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {budget.items.map((item) => (
            <div key={item.department} className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${toneClassByType[item.tone]}`}
              />
              <div>
                <p className="text-xs font-bold text-slate-500">
                  {item.department}
                </p>
                <p className="text-sm font-black">
                  {item.amount} ({item.share})
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(BudgetAllocationCard);
