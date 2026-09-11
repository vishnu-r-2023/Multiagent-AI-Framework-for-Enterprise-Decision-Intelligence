import { memo } from "react";

const statusClassByTone = {
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const statusDotClassByTone = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
};

function RecentReportsTable({ reports }) {
  return (
    <section className="glass-card overflow-hidden rounded-xl border border-slate-100">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <h3 className="font-bold">Recent Reports</h3>
        <div className="flex gap-2">
          <button className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-200">
            All Types
          </button>
          <button className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100">
            Favorites
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-4">Report Name</th>
              <th className="px-6 py-4">Generated Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Author</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {reports.map((report) => (
              <tr
                key={report.name}
                className="transition-colors hover:bg-slate-50/50"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400">
                      description
                    </span>
                    <span className="font-semibold text-slate-900">
                      {report.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500">{report.generatedAt}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      statusClassByTone[report.statusTone]
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        statusDotClassByTone[report.statusTone]
                      } ${report.statusTone === "success" ? "animate-pulse" : ""}`}
                    />
                    {report.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <img
                      src={report.authorAvatar}
                      alt={`Avatar for ${report.author}`}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                    <span>{report.author}</span>
                  </div>
                </td>
                <td className="space-x-2 px-6 py-4 text-right">
                  <button
                    className={`rounded-lg p-1.5 transition-colors ${
                      report.downloadable
                        ? "text-primary hover:bg-primary/10"
                        : "cursor-not-allowed text-slate-300"
                    }`}
                    disabled={!report.downloadable}
                    title="Download PDF"
                  >
                    <span className="material-symbols-outlined text-lg">
                      picture_as_pdf
                    </span>
                  </button>
                  <button
                    className={`rounded-lg p-1.5 transition-colors ${
                      report.downloadable
                        ? "text-primary hover:bg-primary/10"
                        : "cursor-not-allowed text-slate-300"
                    }`}
                    disabled={!report.downloadable}
                    title="Download Excel"
                  >
                    <span className="material-symbols-outlined text-lg">
                      table_view
                    </span>
                  </button>
                  <button className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200">
                    <span className="material-symbols-outlined text-lg">
                      more_vert
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4 text-xs text-slate-500">
        <p>Showing 1-10 of 48 reports</p>
        <div className="flex gap-1">
          <button className="rounded p-1 transition-colors hover:bg-slate-200">
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <button className="flex h-6 w-6 items-center justify-center rounded bg-primary font-bold text-white">
            1
          </button>
          <button className="flex h-6 w-6 items-center justify-center rounded font-bold transition-colors hover:bg-slate-200">
            2
          </button>
          <button className="flex h-6 w-6 items-center justify-center rounded font-bold transition-colors hover:bg-slate-200">
            3
          </button>
          <button className="rounded p-1 transition-colors hover:bg-slate-200">
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default memo(RecentReportsTable);
