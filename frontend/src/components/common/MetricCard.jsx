import { memo } from "react";

const ICON_ACCENT_CLASSES = [
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-200",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
];

function MetricCard({ title, value, icon, trend, trendPositive, comparison }) {
  const accentIndex =
    title
      .split("")
      .reduce((total, character) => total + character.charCodeAt(0), 0) %
    ICON_ACCENT_CLASSES.length;

  return (
    <article className="kpi-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>

        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${ICON_ACCENT_CLASSES[accentIndex]}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold ${
            trendPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">
            {trendPositive ? "trending_up" : "trending_down"}
          </span>
          {trend}
        </span>
        <span className="text-slate-500">{comparison}</span>
      </div>
    </article>
  );
}

export default memo(MetricCard);
