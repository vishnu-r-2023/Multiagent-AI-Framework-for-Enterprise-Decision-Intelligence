import { memo } from "react";

function RegionalDistributionCard({ regions, mapImage }) {
  return (
    <section className="glass-card rounded-xl border border-white/40 p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h4 className="text-lg font-bold text-slate-900">Regional Distribution</h4>
        <button className="text-sm font-bold text-primary hover:underline">
          View Map
        </button>
      </div>

      <div className="space-y-6">
        {regions.map((entry) => (
          <div key={entry.region}>
            <div className="mb-2 flex justify-between">
              <span className="text-sm font-semibold text-slate-700">
                {entry.region}
              </span>
              <span className="text-sm font-bold text-slate-900">
                {entry.amount}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${entry.barClass}`}
                style={{ width: `${entry.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-8 h-48 overflow-hidden rounded-xl">
        <img
          src={mapImage}
          alt="Global distribution map"
          className="h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/20">
          <span className="text-sm font-medium text-slate-500">
            Global Distribution Map View
          </span>
        </div>
      </div>
    </section>
  );
}

export default memo(RegionalDistributionCard);
