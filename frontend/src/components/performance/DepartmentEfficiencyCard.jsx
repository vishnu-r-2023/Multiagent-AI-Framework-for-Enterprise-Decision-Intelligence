import { memo } from "react";

function DepartmentEfficiencyCard({ departments }) {
  return (
    <section className="glass-card rounded-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h4 className="font-bold text-slate-900">Departmental Efficiency</h4>
        <button className="text-xs font-bold text-primary">View Details</button>
      </div>

      <div className="space-y-4">
        {departments.map((department) => (
          <div key={department.name}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium text-slate-700">{department.name}</span>
              <span className="font-bold text-slate-900">{department.score}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full ${department.barClass}`}
                style={{ width: `${department.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default memo(DepartmentEfficiencyCard);
