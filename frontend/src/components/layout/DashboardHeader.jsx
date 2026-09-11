import { memo } from "react";
import ThemeToggle from "../common/ThemeToggle";
import UserProfileBadge from "../common/UserProfileBadge";
import { useUser } from "../../context/UserContext";

function DashboardHeader() {
  const { user } = useUser();

  return (
    <header className="top-floating-bar">
      <div className="flex-1">
        <h2 className="topbar-title">Overview Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
          Welcome back, {user.role}
        </p>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <ThemeToggle variant="topbar" />
        <button className="topbar-icon-btn flex h-11 w-11 items-center justify-center rounded-full">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="topbar-action-btn flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-white sm:px-5">
          <span className="material-symbols-outlined text-xl">download</span>
          Download Report
        </button>

        <div className="ml-0 pl-0 sm:ml-1 sm:pl-2">
          <UserProfileBadge compact />
        </div>
      </div>
    </header>
  );
}

export default memo(DashboardHeader);
