import { memo } from "react";
import SalesKpiCard from "./SalesKpiCard";

function SalesKpiGrid({ items }) {
  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {items.map((item) => (
        <SalesKpiCard key={item.title} item={item} />
      ))}
    </section>
  );
}

export default memo(SalesKpiGrid);
