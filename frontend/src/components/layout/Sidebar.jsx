import { memo, useMemo } from "react";
import { NAV_ITEMS } from "../../config/navigation";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "Auto" },
];

function Sidebar({
  activePage = "dashboard",
  onNavigate = () => {},
  isCollapsed = false,
  onToggleCollapse = () => {},
}) {
  const { user, logout } = useUser();
  const { themeMode, setThemeMode } = useTheme();
  const userRole = user?.role || "Employee";
  const userName = user?.name || "User";

  const allowedNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => item.roles.includes(userRole)),
    [userRole]
  );

  const renderNavButton = (item, index) => {
    const isActive = item.page === activePage;

    return (
      <button
        key={`${item.label}-${index}`}
        type="button"
        onClick={() => {
          if (item.page) {
            onNavigate(item.page);
          }
        }}
        aria-current={isActive ? "page" : undefined}
        className={`sidebar-link group ${isCollapsed ? "justify-center" : "justify-start"} ${
          isActive ? "sidebar-link-active" : ""
        }`}
        title={isCollapsed ? item.label : undefined}
      >
        <span className={`flex items-center ${isCollapsed ? "gap-0" : "gap-3"}`}>
          <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
          {!isCollapsed && <span className="truncate text-[1.02rem] font-medium">{item.label}</span>}
        </span>
      </button>
    );
  };

  const handleLogout = () => {
    logout();
    window.location.hash = "#login";
  };

  return (
    <aside
      className={`sidebar-panel relative w-full shrink-0 border-b border-white/10 transition-all duration-300 lg:h-screen lg:border-b-0 lg:border-r lg:border-r-white/10 ${
        isCollapsed ? "lg:w-[104px]" : "lg:w-[326px]"
      }`}
    >
      <div className="sidebar-overlay" aria-hidden="true" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center justify-between px-5 pb-4 pt-6">
          {!isCollapsed && (
            <div>
              <p className="sidebar-signature">Perform IQ</p>
              <button
                type="button"
                onClick={() => onNavigate("profile")}
                className={`sidebar-user-tag mt-2 ${activePage === "profile" ? "sidebar-user-tag-active" : ""}`}
              >
                <span className="material-symbols-outlined text-[14px]">person</span>
                <span className="truncate">{userName}</span>
                <span className="sidebar-user-dot" aria-hidden="true" />
                <span className="truncate">{userRole}</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 transition hover:bg-white/10"
            aria-label={isCollapsed ? "Expand menu" : "Collapse menu"}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isCollapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>
        </div>

        <div className="sidebar-scroll flex-1 space-y-5 overflow-y-auto px-4 pb-4">
          {!isCollapsed && <p className="sidebar-section-label">Main</p>}

          <div className="space-y-1.5">
            {allowedNavItems.map((item, index) => renderNavButton(item, index))}
          </div>
        </div>

        <div className="space-y-3 px-4 pb-4 pt-2">
          {!isCollapsed && (
            <div className="sidebar-theme-track">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setThemeMode(option.value)}
                  className={`sidebar-theme-option ${
                    themeMode === option.value ? "sidebar-theme-option-active" : ""
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className={`inline-flex h-10 w-full items-center rounded-xl border border-white/20 bg-white/5 text-slate-100 transition hover:bg-white/10 ${
              isCollapsed ? "justify-center" : "justify-start gap-2 px-3"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            {!isCollapsed && <span className="text-sm font-semibold">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default memo(Sidebar);

