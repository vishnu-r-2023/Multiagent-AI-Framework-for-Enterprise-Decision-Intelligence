import { memo } from "react";
import DepartmentEfficiencyCard from "./DepartmentEfficiencyCard";
import ProductivityTrendCard from "./ProductivityTrendCard";

function PerformanceChartsSection({ trendData, departments }) {
  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ProductivityTrendCard trendData={trendData} />
      <DepartmentEfficiencyCard departments={departments} />
    </section>
  );
}

export default memo(PerformanceChartsSection);
