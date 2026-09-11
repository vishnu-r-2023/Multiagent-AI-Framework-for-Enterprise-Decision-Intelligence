import { memo } from "react";

function KpiCard({ icon, change, isPositive, title, value }) {
  return (
    <article className="glass-card flex flex-col gap-3 rounded-2xl border border-white/40 p-6">
      <div className="flex items-center justify-between">
        <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">
          {icon}
        </span>
        <span
          className={`rounded-full px-2 py-1 text-xs font-bold ${
            isPositive
              ? "bg-emerald-50 text-emerald-500"
              : "bg-rose-50 text-rose-500"
          }`}
        >
          {change}
        </span>
      </div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </article>
  );
}

export default memo(KpiCard);
