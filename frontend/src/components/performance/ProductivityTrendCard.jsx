import { memo } from "react";

const barColorClasses = [
  "bg-primary/20",
  "bg-primary/30",
  "bg-primary/40",
  "bg-primary/60",
  "bg-primary/80",
  "bg-primary",
];

function ProductivityTrendCard({ trendData }) {
  return (
    <section className="glass-card flex flex-col rounded-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h4 className="font-bold text-slate-900">Productivity Trend</h4>
        <select className="rounded-lg border-none bg-slate-100 px-3 py-1 text-xs font-semibold">
          <option>Last 6 Months</option>
          <option>Year to Date</option>
        </select>
      </div>

      <div className="relative h-64 w-full">
        <div className="absolute inset-0 flex items-end justify-between px-2">
          {trendData.map((point, index) => (
            <div
              key={point.month}
              className={`w-10 rounded-t-lg ${barColorClasses[index % barColorClasses.length]}`}
              style={{ height: `${point.height}px` }}
            />
          ))}
        </div>
        <div className="absolute inset-0 border-b border-slate-200" />
      </div>

      <div className="mt-4 flex justify-between px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {trendData.map((point) => (
          <span key={`${point.month}-label`}>{point.month}</span>
        ))}
      </div>
    </section>
  );
}

export default memo(ProductivityTrendCard);
