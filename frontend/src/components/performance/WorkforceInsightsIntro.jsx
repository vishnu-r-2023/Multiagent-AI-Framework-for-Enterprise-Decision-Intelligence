import { memo } from "react";

function WorkforceInsightsIntro() {
  return (
    <section>
      <h3 className="mb-2 text-2xl font-black text-slate-900">Workforce Insights</h3>
      <p className="text-sm text-slate-500">
        Real-time monitoring of global productivity and talent retention metrics.
      </p>
    </section>
  );
}

export default memo(WorkforceInsightsIntro);
