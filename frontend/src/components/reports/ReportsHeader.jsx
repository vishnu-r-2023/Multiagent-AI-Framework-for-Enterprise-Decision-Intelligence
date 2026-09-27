import { memo } from "react";
import ThemeToggle from "../common/ThemeToggle";
import UserProfileBadge from "../common/UserProfileBadge";

function ReportsHeader() {
  return (
    <header className="top-floating-bar">
      <div className="flex w-full flex-1 flex-col gap-3 sm:max-w-xl sm:flex-row sm:items-center sm:gap-4">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400/90">
            search
          </span>
          <input
            type="text"
            placeholder="Search reports, templates, or keywords..."
            className="topbar-input w-full rounded-full py-2.5 pl-11 pr-4 text-sm"
          />
        </div>
        <button className="topbar-filter-btn flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium sm:justify-start">
          <span className="material-symbols-outlined text-sm">filter_list</span>
          Filters
        </button>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle variant="topbar" />
        <button className="topbar-icon-btn h-11 w-11 rounded-full">
          <span className="material-symbols-outlined">notifications</span>
        </button>

        <div className="pl-0 sm:pl-1">
          <UserProfileBadge compact />
        </div>
      </div>
    </header>
  );
}

export default memo(ReportsHeader);
