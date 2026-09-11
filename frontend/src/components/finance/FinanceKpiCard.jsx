import { memo } from "react";

const changeClassByTone = {
  positive: "bg-green-100 text-green-600",
  negative: "bg-red-100 text-red-600",
};

function FinanceKpiCard({ item }) {
  return (
    <article className="glass-card rounded-xl border-l-4 border-l-primary p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
          {item.title}
        </p>
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-bold ${
            changeClassByTone[item.changeTone]
          }`}
        >
          {item.change}
        </span>
      </div>
      <h3 className="text-3xl font-black text-slate-900">{item.value}</h3>
      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-primary" style={{ width: `${item.progress}%` }} />
      </div>
    </article>
  );
}

export default memo(FinanceKpiCard);
