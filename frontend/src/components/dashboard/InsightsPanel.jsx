import { memo } from "react";

const toneClassByType = {
  success: {
    container: "border-emerald-100 bg-emerald-50/50",
    icon: "text-emerald-500",
  },
  warning: {
    container: "border-amber-100 bg-amber-50/50",
    icon: "text-amber-500",
  },
  info: {
    container: "border-primary/10 bg-primary/5",
    icon: "text-primary",
  },
};

function InsightsPanel({ insights }) {
  return (
    <aside className="glass-card rounded-3xl border border-white/40 p-6 sm:p-8">
      <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-900">
        <span className="material-symbols-outlined text-primary">lightbulb</span>
        Insights & Alerts
      </h3>

      <div className="space-y-4">
        {insights.map((insight) => (
          <article
            key={insight.title}
            className={`rounded-2xl border p-4 ${
              toneClassByType[insight.tone].container
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`material-symbols-outlined mt-1 ${
                  toneClassByType[insight.tone].icon
                }`}
              >
                {insight.icon}
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">{insight.title}</p>
                <p className="mt-1 text-xs text-slate-500">{insight.description}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <button className="mt-6 w-full rounded-2xl border-2 border-dashed border-slate-200 py-4 text-sm font-bold text-slate-400 transition-all hover:border-primary hover:text-primary">
        Configure Alert Rules
      </button>
    </aside>
  );
}

export default memo(InsightsPanel);
