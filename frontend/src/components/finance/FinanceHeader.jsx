import { memo } from "react";
import ThemeToggle from "../common/ThemeToggle";
import UserProfileBadge from "../common/UserProfileBadge";

function FinanceHeader() {
  return (
    <header className="top-floating-bar">
      <div className="flex items-center gap-6">
        <h2 className="topbar-title">Finance Overview</h2>
        <div className="relative hidden lg:block">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400/90">
            search
          </span>
          <input
            type="text"
            placeholder="Search analytics, files, or teams..."
            className="topbar-input w-full rounded-full py-2.5 pl-11 pr-4 text-sm sm:w-80"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <ThemeToggle variant="topbar" />
        <button className="topbar-icon-btn relative h-11 w-11 rounded-full">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-slate-900 bg-red-500" />
        </button>
        <button className="topbar-icon-btn h-11 w-11 rounded-full">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <button className="topbar-action-btn flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white">
          <span className="material-symbols-outlined text-sm">add</span>
          <span>Create Report</span>
        </button>

        <div className="pl-0 sm:pl-1">
          <UserProfileBadge compact />
        </div>
      </div>
    </header>
  );
}

export default memo(FinanceHeader);
