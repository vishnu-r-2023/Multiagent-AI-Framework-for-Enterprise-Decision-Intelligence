import { memo } from "react";
import InsightsPanel from "./InsightsPanel";
import StaffTable from "./StaffTable";

function BottomSection({ staffMembers, insights }) {
  return (
    <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <StaffTable staffMembers={staffMembers} />
      <InsightsPanel insights={insights} />
    </section>
  );
}

export default memo(BottomSection);
