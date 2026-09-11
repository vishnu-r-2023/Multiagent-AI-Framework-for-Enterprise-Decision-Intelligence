import { memo } from "react";
import ThemeToggle from "../common/ThemeToggle";
import UserProfileBadge from "../common/UserProfileBadge";

function PerformanceHeader() {
  return (
    <header className="top-floating-bar">
      <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
        <h2 className="topbar-title">Performance Dashboard</h2>
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400/90">
            search
          </span>
          <input
            type="text"
            placeholder="Search employees, metrics, or reports..."
            className="topbar-input w-full rounded-full py-2.5 pl-11 pr-4 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle variant="topbar" />
        <button className="topbar-action-btn flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90">
          <span className="material-symbols-outlined text-sm">download</span>
          Export Data
        </button>
        <button className="topbar-icon-btn flex h-11 w-11 items-center justify-center rounded-full">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="topbar-icon-btn flex h-11 w-11 items-center justify-center rounded-full">
          <span className="material-symbols-outlined">chat_bubble</span>
        </button>
        <div className="pl-0 sm:pl-1">
          <UserProfileBadge compact />
        </div>
      </div>
    </header>
  );
}

export default memo(PerformanceHeader);
