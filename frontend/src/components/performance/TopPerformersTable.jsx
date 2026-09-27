import { memo, useMemo } from "react";

const RatingStars = memo(function RatingStars({ rating }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
  const fullStarsArr = useMemo(() => Array.from({ length: fullStars }), [fullStars]);
  const emptyStarsArr = useMemo(() => Array.from({ length: emptyStars }), [emptyStars]);

  return (
    <div className="flex text-amber-400">
      {fullStarsArr.map((_, index) => (
        <span
          key={`full-${index}`}
          className="material-symbols-outlined text-[18px]"
          style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
        >
          star
        </span>
      ))}
      {hasHalf && (
        <span className="material-symbols-outlined text-[18px]">star_half</span>
      )}
      {emptyStarsArr.map((_, index) => (
        <span key={`empty-${index}`} className="material-symbols-outlined text-[18px]">
          star
        </span>
      ))}
    </div>
  );
});

function TopPerformersTable({ performers }) {
  return (
    <section className="glass-card mb-10 overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <h4 className="font-bold text-slate-900">Top Performers - This Month</h4>
        <button className="text-sm font-semibold text-primary hover:underline">
          View All Employees
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Task Completion</th>
              <th className="px-6 py-4">Rating</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {performers.map((performer) => (
              <tr
                key={performer.name}
                className="transition-colors hover:bg-slate-50/50"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={performer.avatar}
                      alt={`Headshot of ${performer.name}`}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{performer.name}</p>
                      <p className="text-xs text-slate-500">{performer.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-tight ${performer.departmentClass}`}
                  >
                    {performer.department}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-700">
                  {performer.completionRate}
                </td>
                <td className="px-6 py-4">
                  <RatingStars rating={performer.rating} />
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 transition-colors hover:text-primary">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default memo(TopPerformersTable);
