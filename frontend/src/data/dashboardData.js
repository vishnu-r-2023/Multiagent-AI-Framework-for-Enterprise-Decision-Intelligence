export const REQUIRED_DATASET_FIELDS = [
  "Employee_ID",
  "Department",
  "JobRole",
  "Age",
  "MonthlyIncome",
  "PerformanceRating",
  "JobSatisfaction",
  "Attrition",
];

export const REQUIRED_WORKBOOK_SHEETS = [
  "HR_Employees",
  "Sales",
  "Marketing",
  "Finance",
  "Operations",
];

export const DATE_RANGE_OPTIONS = [
  { value: "30d", label: "Last 30 days", months: 3 },
  { value: "90d", label: "Last 90 days", months: 6 },
  { value: "180d", label: "Last 180 days", months: 9 },
  { value: "365d", label: "Last 12 months", months: 12 },
];

export const DEPARTMENT_CHART_COLORS = [
  "#6366f1",
  "#06b6d4",
  "#f97316",
  "#22c55e",
  "#e879f9",
  "#f59e0b",
  "#ef4444",
  "#14b8a6",
];

export const VIBRANT_CHART_COLORS = [
  "#8b5cf6",
  "#22d3ee",
  "#f43f5e",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#84cc16",
  "#fb7185",
];

export const KPI_ICON_MAP = {
  totalEmployees: "group",
  attritionRate: "person_remove",
  averageSalary: "currency_rupee",
  averageJobSatisfaction: "sentiment_satisfied",
  averagePerformanceRating: "workspace_premium",
  averageWorkLifeBalance: "balance",
};

export const REPORT_LIBRARY = [
  {
    id: "department-performance",
    name: "Department Performance Report",
    description:
      "Compare department productivity, satisfaction, and retention in one summary.",
  },
  {
    id: "employee-retention",
    name: "Employee Retention Report",
    description:
      "Track attrition drivers and retention risk by department and role.",
  },
  {
    id: "salary-distribution",
    name: "Salary Distribution Report",
    description:
      "Review salary bands and compensation spread for equitable planning.",
  },
];
