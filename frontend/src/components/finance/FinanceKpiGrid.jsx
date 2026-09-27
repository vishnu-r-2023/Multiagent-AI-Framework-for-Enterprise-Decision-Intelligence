import { memo } from "react";
import FinanceKpiCard from "./FinanceKpiCard";

function FinanceKpiGrid({ items }) {
  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {items.map((item) => (
        <FinanceKpiCard key={item.title} item={item} />
      ))}
    </section>
  );
}

export default memo(FinanceKpiGrid);
