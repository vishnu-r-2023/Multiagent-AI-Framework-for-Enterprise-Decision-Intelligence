import { memo } from "react";

function SalesTrendChart({ months }) {
  return (
    <section className="glass-card rounded-xl border border-white/40 p-6 shadow-sm sm:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-lg font-bold text-slate-900">
            Revenue Performance Trend
          </h4>
          <p className="text-sm text-slate-500">
            Global sales trajectory over the last 12 months
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200">
            Weekly
          </button>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm">
            Monthly
          </button>
        </div>
      </div>

      <div className="relative h-80 w-full">
        <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <defs>
            <linearGradient id="sales-gradient" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#137fec" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#137fec" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,250 Q100,230 200,180 T400,150 T600,200 T800,80 T1000,120 L1000,300 L0,300 Z"
            fill="url(#sales-gradient)"
          />
          <path
            d="M0,250 Q100,230 200,180 T400,150 T600,200 T800,80 T1000,120"
            fill="none"
            stroke="#137fec"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <circle cx="200" cy="180" r="5" fill="white" stroke="#137fec" strokeWidth="3" />
          <circle cx="400" cy="150" r="5" fill="white" stroke="#137fec" strokeWidth="3" />
          <circle cx="600" cy="200" r="5" fill="white" stroke="#137fec" strokeWidth="3" />
          <circle cx="800" cy="80" r="5" fill="white" stroke="#137fec" strokeWidth="3" />
        </svg>
        <div className="mt-4 flex flex-wrap justify-between gap-x-2 px-2 text-xs font-bold uppercase tracking-widest text-slate-400">
          {months.map((month) => (
            <span key={month}>{month}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(SalesTrendChart);
