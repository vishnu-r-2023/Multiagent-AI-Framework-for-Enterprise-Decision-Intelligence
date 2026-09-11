import { memo } from "react";

function SalesKpiCard({ item }) {
  return (
    <article className="glass-card rounded-xl border border-white/40 p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-lg ${item.iconClass}`}
        >
          <span className="material-symbols-outlined">{item.icon}</span>
        </div>
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-sm font-bold ${item.changeClass}`}
        >
          <span className="material-symbols-outlined text-xs">{item.trendIcon}</span>
          {item.change}
        </span>
      </div>

      <p className="text-sm font-medium text-slate-500">{item.title}</p>
      <h3 className="mt-1 text-3xl font-bold text-slate-900">{item.value}</h3>
      <p className="mt-4 text-xs text-slate-400">{item.detail}</p>
    </article>
  );
}

export default memo(SalesKpiCard);
