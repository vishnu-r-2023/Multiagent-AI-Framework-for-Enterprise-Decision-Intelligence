import { memo } from "react";
import PerformanceKpiCard from "./PerformanceKpiCard";

function PerformanceKpiGrid({ items }) {
  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {items.map((item) => (
        <PerformanceKpiCard key={item.title} item={item} />
      ))}
    </section>
  );
}

export default memo(PerformanceKpiGrid);
