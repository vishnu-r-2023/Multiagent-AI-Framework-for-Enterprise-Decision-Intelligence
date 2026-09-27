import { memo } from "react";

function RevenueExpensesChart({ bars }) {
  return (
    <section className="glass-card rounded-xl p-8 shadow-sm">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-lg font-bold">Revenue vs Expenses</h4>
          <p className="text-sm text-slate-500">Monthly comparison for 2024</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-xs text-slate-500">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-slate-300" />
            <span className="text-xs text-slate-500">Expenses</span>
          </div>
        </div>
      </div>

      <div className="flex h-[300px] items-end gap-4 px-2">
        {bars.map((bar) => (
          <div
            key={bar.month}
            className="group flex flex-1 flex-col justify-end gap-1"
          >
            <div
              className="w-full rounded-t bg-slate-300/40 transition-colors group-hover:bg-slate-300"
              style={{ height: `${bar.expenses}%` }}
            />
            <div
              className="w-full rounded-b bg-primary/80 transition-colors group-hover:bg-primary"
              style={{ height: `${bar.revenue}%` }}
            />
            <span className="mt-2 text-center text-[10px] font-bold text-slate-400">
              {bar.month}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default memo(RevenueExpensesChart);
