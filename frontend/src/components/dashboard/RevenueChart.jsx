import { memo } from "react";

function RevenueChart() {
  return (
    <section className="glass-card rounded-3xl border border-white/40 p-6 sm:p-8 lg:col-span-2">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-slate-900">Revenue Over Time</h3>
        <div className="flex gap-2">
          <button className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white">
            6 Months
          </button>
          <button className="rounded-full px-4 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100">
            1 Year
          </button>
        </div>
      </div>

      <div className="relative h-64">
        <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 800 200">
          <defs>
            <linearGradient id="revenue-gradient" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#137fec" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#137fec" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path
            d="M0,150 C50,140 100,60 150,80 C200,100 250,160 300,140 C350,120 400,40 450,50 C500,60 550,130 600,110 C650,90 700,20 750,30 L800,40 L800,200 L0,200 Z"
            fill="url(#revenue-gradient)"
          />
          <path
            d="M0,150 C50,140 100,60 150,80 C200,100 250,160 300,140 C350,120 400,40 450,50 C500,60 550,130 600,110 C650,90 700,20 750,30 L800,40"
            fill="none"
            stroke="#137fec"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <circle cx="150" cy="80" r="6" fill="#137fec" stroke="white" strokeWidth="2" />
          <circle cx="450" cy="50" r="6" fill="#137fec" stroke="white" strokeWidth="2" />
          <circle cx="750" cy="30" r="6" fill="#137fec" stroke="white" strokeWidth="2" />
        </svg>

        <div className="mt-6 flex justify-between px-2 text-xs font-bold uppercase tracking-widest text-slate-400">
          <span>Jan</span>
          <span>Feb</span>
          <span>Mar</span>
          <span>Apr</span>
          <span>May</span>
          <span>Jun</span>
          <span>Jul</span>
        </div>
      </div>
    </section>
  );
}

export default memo(RevenueChart);
