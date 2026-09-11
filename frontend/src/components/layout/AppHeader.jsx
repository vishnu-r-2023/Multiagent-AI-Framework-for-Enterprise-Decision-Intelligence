import { memo, useEffect, useMemo } from "react";
import { DATE_RANGE_OPTIONS } from "../../data/dashboardData";
import { useAnalytics } from "../../context/AnalyticsContext";
import { useUser } from "../../context/UserContext";
import UserAvatarFallbackIcon from "../common/UserAvatarFallbackIcon";

const PAGE_TITLES = {
  dashboard: "Business Analytics Dashboard",
  sales: "Sales Analytics",
  performance: "Employee Performance",
  finance: "Finance Overview",
  marketing: "Marketing Analytics",
  operations: "Operations",
  reports: "Reports",
  upload: "Dataset Upload",
  profile: "User Profile",
};

const SEARCH_PLACEHOLDERS = {
  dashboard: "Search by employee ID, department, or job role",
  sales: "Search by region, sales channel, product, or sales rep",
  performance: "Search by employee ID, department, or job role",
  finance: "Search by department",
  marketing: "Search by channel or campaign",
  operations: "Search by process, shift, or department",
  reports: "Search by employee ID, department, or job role",
};

const buildDepartmentOptions = (records = [], field = "department") => {
  const departments = Array.from(
    new Set(
      records
        .map((record) => String(record?.[field] || "").trim())
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right));

  return ["All Departments", ...departments];
};

function MetadataBadge({ icon, children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-slate-200/75 bg-white/72 px-3 py-1.5 text-sm font-medium text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.05)] backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/48 dark:text-slate-300 dark:shadow-[0_12px_24px_rgba(2,6,23,0.24)] ${className}`}
    >
      <span className="material-symbols-outlined text-[16px] text-violet-500 dark:text-violet-300">{icon}</span>
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}

const filterLabelClassName =
  "mb-2 inline-flex items-center gap-1.5 pl-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400";

const filterControlClassName =
  "h-14 w-full rounded-full border border-slate-200/80 bg-white/82 px-5 text-[15px] font-medium text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.05)] outline-none transition duration-200 focus:border-fuchsia-400 focus:bg-white focus:ring-4 focus:ring-fuchsia-100/80 dark:border-slate-700/80 dark:bg-slate-900/62 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:bg-slate-900 dark:focus:ring-violet-500/20";

function AppHeader({ activePage = "dashboard", onNavigate = () => {} }) {
  const {
    employees,
    salesRecords,
    financeRecords,
    operationsRecords,
    searchQuery,
    setSearchQuery,
    departmentFilter,
    setDepartmentFilter,
    availableDepartments,
    dateRange,
    setDateRange,
    datasetMeta,
  } = useAnalytics();

  const { user } = useUser();

  const pageTitle = PAGE_TITLES[activePage] || PAGE_TITLES.dashboard;
  const showFilters = !["profile", "upload"].includes(activePage);
  const showDepartmentFilter = activePage !== "marketing";
  const searchPlaceholder = SEARCH_PLACEHOLDERS[activePage] || SEARCH_PLACEHOLDERS.dashboard;
  const departmentOptions = useMemo(() => {
    switch (activePage) {
      case "sales":
        return buildDepartmentOptions(salesRecords);
      case "finance":
        return buildDepartmentOptions(financeRecords);
      case "operations":
        return buildDepartmentOptions(operationsRecords);
      case "dashboard":
      case "performance":
      case "reports":
        return buildDepartmentOptions(employees);
      default:
        return availableDepartments;
    }
  }, [activePage, availableDepartments, employees, financeRecords, operationsRecords, salesRecords]);

  const uploadedLabel = useMemo(() => {
    const date = new Date(datasetMeta.uploadedAt);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [datasetMeta.recordCount, datasetMeta.uploadedAt]);
  const recordCountLabel = useMemo(
    () => new Intl.NumberFormat("en-US").format(datasetMeta.recordCount || 0),
    [datasetMeta.recordCount]
  );

  useEffect(() => {
    if (!showDepartmentFilter) {
      return;
    }

    if (!departmentOptions.includes(departmentFilter)) {
      setDepartmentFilter("All Departments");
    }
  }, [departmentFilter, departmentOptions, setDepartmentFilter, showDepartmentFilter]);

  return (
    <header className="dashboard-topbar relative z-10 px-4 py-4 backdrop-blur-sm transition sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/75 bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-[0_6px_14px_rgba(15,23,42,0.04)] dark:border-white/15 dark:bg-white/[0.07] dark:text-slate-200">
              <span className="material-symbols-outlined text-[14px] text-violet-500 dark:text-violet-300">monitoring</span>
              PerformIQ
            </div>

            <div className="mt-3 flex flex-col gap-3">
              <h1 className="text-3xl font-semibold tracking-[-0.045em] text-slate-900 dark:text-slate-100 sm:text-[2.15rem]">
                {pageTitle}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <MetadataBadge icon="database">Active dataset</MetadataBadge>
                <MetadataBadge icon="folder_managed" className="max-w-full">
                  <span className="block max-w-[270px] truncate sm:max-w-[380px] lg:max-w-[460px]">
                    {datasetMeta.fileName}
                  </span>
                </MetadataBadge>
                <MetadataBadge icon="inventory_2">{recordCountLabel} records</MetadataBadge>
                <MetadataBadge icon="schedule">{uploadedLabel}</MetadataBadge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start">
            <button
              type="button"
              onClick={() => onNavigate("upload")}
              className="group relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-full border border-slate-900/10 bg-slate-900 px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_18px_30px_rgba(15,23,42,0.18)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300/60 dark:border-white/15 dark:bg-white/[0.08] dark:text-white dark:backdrop-blur-sm dark:hover:bg-white/[0.12] dark:focus-visible:ring-white/20"
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent dark:from-white/30" />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/[0.08] via-transparent to-white/[0.03] dark:from-cyan-300/10 dark:via-white/[0.02] dark:to-violet-300/10" />
              <span className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/4 -skew-x-12 bg-white/20 blur-sm transition-transform duration-500 group-hover:translate-x-[420%]" />
              <span className="relative z-10 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                Dataset Upload
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("profile")}
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/75 bg-white/68 shadow-[0_10px_22px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/50 transition duration-200 hover:-translate-y-0.5 hover:ring-slate-300/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300/50 dark:border-slate-700/80 dark:bg-slate-900/48 dark:ring-slate-700/60 dark:hover:ring-slate-500/80 dark:focus-visible:ring-slate-500/30"
              title={`${user.name} (${user.role})`}
              aria-label="User profile"
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <UserAvatarFallbackIcon className="h-5 w-5 text-slate-700 dark:text-slate-100" />
              )}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="rounded-2xl border border-slate-200/75 bg-white/42 p-3 shadow-[0_12px_28px_rgba(15,23,42,0.04)] backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-950/28 dark:shadow-[0_18px_34px_rgba(2,6,23,0.22)] sm:p-4">
            <div
              className={`grid grid-cols-1 gap-3 xl:gap-4 ${
                showDepartmentFilter
                  ? "xl:grid-cols-[minmax(0,1.7fr)_minmax(240px,0.95fr)_minmax(220px,0.9fr)]"
                  : "xl:grid-cols-[minmax(0,1.8fr)_minmax(220px,0.9fr)]"
              }`}
            >
              <label className="group block">
                <span className={filterLabelClassName}>
                  <span className="material-symbols-outlined text-[14px] text-slate-400 transition group-focus-within:text-fuchsia-500 dark:text-slate-500 dark:group-focus-within:text-violet-300">
                    search
                  </span>
                  Search
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/80 bg-slate-50/90 text-slate-400 shadow-[0_6px_14px_rgba(15,23,42,0.04)] transition group-focus-within:border-fuchsia-200 group-focus-within:text-fuchsia-500 dark:border-slate-700/80 dark:bg-slate-800/85 dark:text-slate-500 dark:group-focus-within:border-violet-400/50 dark:group-focus-within:text-violet-300">
                    <span className="material-symbols-outlined text-[18px]">search</span>
                  </span>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={searchPlaceholder}
                    className={`${filterControlClassName} pl-16 pr-4 placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                  />
                </div>
              </label>

              {showDepartmentFilter && (
                <label className="group block">
                  <span className={filterLabelClassName}>
                    <span className="material-symbols-outlined text-[14px] text-slate-400 transition group-focus-within:text-fuchsia-500 dark:text-slate-500 dark:group-focus-within:text-violet-300">
                      corporate_fare
                    </span>
                    Department
                  </span>
                  <div className="relative">
                    <select
                      value={departmentFilter}
                      onChange={(event) => setDepartmentFilter(event.target.value)}
                      className={`${filterControlClassName} appearance-none pr-11`}
                    >
                      {departmentOptions.map((department) => (
                        <option key={department} value={department}>
                          {department}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400 transition group-focus-within:text-fuchsia-500 dark:text-slate-500 dark:group-focus-within:text-violet-300">
                      <span className="material-symbols-outlined text-[20px]">expand_more</span>
                    </span>
                  </div>
                </label>
              )}

              <label className="group block">
                <span className={filterLabelClassName}>
                  <span className="material-symbols-outlined text-[14px] text-slate-400 transition group-focus-within:text-fuchsia-500 dark:text-slate-500 dark:group-focus-within:text-violet-300">
                    calendar_month
                  </span>
                  Date Range
                </span>
                <div className="relative">
                  <select
                    value={dateRange}
                    onChange={(event) => setDateRange(event.target.value)}
                    className={`${filterControlClassName} appearance-none pr-11`}
                  >
                    {DATE_RANGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400 transition group-focus-within:text-fuchsia-500 dark:text-slate-500 dark:group-focus-within:text-violet-300">
                    <span className="material-symbols-outlined text-[20px]">expand_more</span>
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default memo(AppHeader);
