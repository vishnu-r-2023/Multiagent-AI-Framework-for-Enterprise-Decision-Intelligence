import { memo } from "react";
import { useUser } from "../../context/UserContext";
import UserAvatarFallbackIcon from "./UserAvatarFallbackIcon";

function UserProfileBadge({ compact = false }) {
  const { user } = useUser();

  return (
    <div className={`flex items-center ${compact ? "gap-2" : "gap-3"}`}>
      <div className={`text-right ${compact ? "hidden sm:block" : ""}`}>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {user.name}
        </p>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {user.role}
        </p>
      </div>
      <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white/70 bg-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-700">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={`Profile for ${user.name}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UserAvatarFallbackIcon className="h-5 w-5 text-slate-700 dark:text-slate-100" />
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(UserProfileBadge);
