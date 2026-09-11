import { memo } from "react";
import ThemeToggle from "../common/ThemeToggle";
import UserProfileBadge from "../common/UserProfileBadge";

function SalesHeader() {
  return (
    <header className="top-floating-bar">
      <div className="flex flex-1 flex-col gap-4 xl:flex-row xl:items-center xl:gap-8">
        <h2 className="topbar-title">Sales Overview</h2>
        <div className="relative w-full max-w-[430px]">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400/90">
            search
          </span>
          <input
            type="text"
            placeholder="Search analytics..."
            className="topbar-input w-full rounded-full py-2.5 pl-11 pr-4 text-base"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle variant="topbar" />
        <button className="topbar-icon-btn relative h-11 w-11 rounded-full">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-slate-900 bg-red-500" />
        </button>
        <button className="topbar-icon-btn h-11 w-11 rounded-full">
          <span className="material-symbols-outlined">chat_bubble</span>
        </button>
        <div className="topbar-divider mx-1 hidden sm:block" />

        <div className="pl-0 sm:pl-1">
          <UserProfileBadge compact />
        </div>
      </div>
    </header>
  );
}

export default memo(SalesHeader);
