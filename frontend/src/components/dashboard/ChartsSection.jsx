import { memo } from "react";
import EfficiencyCard from "./EfficiencyCard";
import RevenueChart from "./RevenueChart";

function ChartsSection({ departments }) {
  return (
    <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <RevenueChart />
      <EfficiencyCard departments={departments} />
    </section>
  );
}

export default memo(ChartsSection);
