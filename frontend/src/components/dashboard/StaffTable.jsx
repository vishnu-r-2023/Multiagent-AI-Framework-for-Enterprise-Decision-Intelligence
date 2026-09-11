import { memo } from "react";

const statusClassByTone = {
  active: "bg-emerald-100 text-emerald-600",
  neutral: "bg-slate-100 text-slate-600",
};

function StaffTable({ staffMembers }) {
  return (
    <section className="glass-card overflow-hidden rounded-3xl border border-white/40 lg:col-span-2">
      <div className="flex items-center justify-between border-b border-slate-100 p-6 sm:p-8">
        <h3 className="text-xl font-bold text-slate-900">
          Recent Operational Staff
        </h3>
        <button className="text-sm font-bold text-primary hover:underline">
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50/50 text-xs font-bold uppercase tracking-widest text-slate-400">
              <th className="px-6 py-4 sm:px-8">Staff Member</th>
              <th className="px-6 py-4 sm:px-8">Department</th>
              <th className="px-6 py-4 sm:px-8">Productivity</th>
              <th className="px-6 py-4 sm:px-8">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staffMembers.map((member) => (
              <tr
                key={member.name}
                className="transition-colors hover:bg-primary/5"
              >
                <td className="px-6 py-4 sm:px-8">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 overflow-hidden rounded-full bg-slate-200 bg-cover bg-center"
                      role="img"
                      aria-label={`Profile picture for ${member.name}`}
                      style={{ backgroundImage: `url('${member.avatar}')` }}
                    />
                    <span className="text-sm font-bold text-slate-900">
                      {member.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 sm:px-8">
                  {member.department}
                </td>
                <td className="px-6 py-4 sm:px-8">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full ${
                        member.productivity >= 80 ? "bg-primary" : "bg-amber-400"
                      }`}
                      style={{ width: `${member.productivity}%` }}
                    />
                  </div>
                </td>
                <td className="px-6 py-4 sm:px-8">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      statusClassByTone[member.statusTone]
                    }`}
                  >
                    {member.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default memo(StaffTable);
