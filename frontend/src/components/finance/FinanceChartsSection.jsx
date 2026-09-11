import { memo } from "react";
import BudgetAllocationCard from "./BudgetAllocationCard";
import RevenueExpensesChart from "./RevenueExpensesChart";

function FinanceChartsSection({ bars, budget }) {
  return (
    <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <RevenueExpensesChart bars={bars} />
      <BudgetAllocationCard budget={budget} />
    </section>
  );
}

export default memo(FinanceChartsSection);
