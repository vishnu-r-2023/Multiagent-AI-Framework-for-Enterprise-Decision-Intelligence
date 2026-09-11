import { memo } from "react";
import RegionalDistributionCard from "./RegionalDistributionCard";
import TopProductsCard from "./TopProductsCard";

function SalesDetailsGrid({ regions, mapImage, products }) {
  return (
    <section className="grid grid-cols-1 gap-8 xl:grid-cols-2">
      <RegionalDistributionCard regions={regions} mapImage={mapImage} />
      <TopProductsCard products={products} />
    </section>
  );
}

export default memo(SalesDetailsGrid);
