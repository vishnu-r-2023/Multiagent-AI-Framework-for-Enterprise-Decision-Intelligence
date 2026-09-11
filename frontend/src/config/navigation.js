export const USER_ROLES = Object.freeze({
  ADMIN: "Admin",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
});

export const DEFAULT_PAGE = "dashboard";

export const NAV_ITEMS = Object.freeze([
  {
    icon: "analytics",
    label: "Dashboard",
    page: "dashboard",
    roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.EMPLOYEE],
  },
  {
    icon: "bar_chart",
    label: "Sales Analytics",
    page: "sales",
    roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  },
  {
    icon: "trending_up",
    label: "Employee Performance",
    page: "performance",
    roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  },
  {
    icon: "account_balance",
    label: "Finance Overview",
    page: "finance",
    roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  },
  {
    icon: "engineering",
    label: "Operations",
    page: "operations",
    roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  },
  {
    icon: "campaign",
    label: "Marketing Analytics",
    page: "marketing",
    roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  },
  {
    icon: "description",
    label: "Reports",
    page: "reports",
    roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.EMPLOYEE],
  },
  {
    icon: "cloud_upload",
    label: "Dataset Upload",
    page: "upload",
    roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.EMPLOYEE],
  },
  {
    icon: "account_circle",
    label: "Profile",
    page: "profile",
    roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.EMPLOYEE],
  }
]);

export const PAGE_TO_HASH = Object.freeze({
  dashboard: "#dashboard",
  sales: "#sales",
  marketing: "#marketing",
  operations: "#operations",
  performance: "#performance",
  finance: "#finance",
  reports: "#reports",
  upload: "#dataset-upload",
  profile: "#profile",
});

const HASH_TO_PAGE = Object.freeze({
  dashboard: "dashboard",
  sales: "sales",
  "sales-analytics": "sales",
  marketing: "marketing",
  "marketing-analytics": "marketing",
  operations: "operations",
  "operations-analytics": "operations",
  performance: "performance",
  "employee-performance": "performance",
  finance: "finance",
  "finance-overview": "finance",
  "financial-overview": "finance",
  reports: "reports",
  upload: "upload",
  "dataset-upload": "upload",
  dataset: "upload",
  profile: "profile",
});

export const normalizeHash = (hash) =>
  String(hash || "")
    .replace(/^#\/?/, "")
    .trim()
    .toLowerCase();

export const resolvePageFromHash = (hash) => HASH_TO_PAGE[normalizeHash(hash)] || null;

export const getPagesForRole = (role) =>
  NAV_ITEMS.filter((item) => item.roles.includes(role)).map((item) => item.page);

export const canAccessPage = (role, page) =>
  NAV_ITEMS.some((item) => item.page === page && item.roles.includes(role));
