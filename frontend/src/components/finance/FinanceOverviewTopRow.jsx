import { memo } from "react";

function FinanceOverviewTopRow() {
  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">
          Finance Overview
        </h2>
        <p className="mt-1 text-slate-500">
          Real-time performance tracking for Q3 2024 fiscal period.
        </p>
      </div>
      <div className="flex gap-2">
        <button className="rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-slate-50">
          Quarterly View
        </button>
        <button className="rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-slate-50">
          Export CSV
        </button>
      </div>
    </section>
  );
}

export default memo(FinanceOverviewTopRow);
