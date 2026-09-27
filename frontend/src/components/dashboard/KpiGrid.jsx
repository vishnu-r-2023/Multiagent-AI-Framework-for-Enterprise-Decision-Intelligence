import { memo } from "react";
import KpiCard from "./KpiCard";

function KpiGrid({ kpis }) {
  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
      {kpis.map((kpi) => (
        <KpiCard
          key={kpi.title}
          icon={kpi.icon}
          change={kpi.change}
          isPositive={kpi.isPositive}
          title={kpi.title}
          value={kpi.value}
        />
      ))}
    </section>
  );
}

export default memo(KpiGrid);
