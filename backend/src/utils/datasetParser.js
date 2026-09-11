import Papa from "papaparse";
import { loadXlsxWorkbook } from "./excelWorkbook.js";

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

const FIELD_ALIASES = {
  SnapshotDate: ["snapshotdate", "snapshot_date", "date", "perioddate"],
  Employee_ID: ["employeeid", "employee_id", "employee id", "id", "empid"],
  Department: ["department", "dept"],
  JobRole: ["jobrole", "job_role", "job role", "role", "designation"],
  Age: ["age"],
  MonthlyIncome: ["monthlyincome", "monthly_income", "salary", "income"],
  PerformanceRating: ["performancerating", "performance_rating", "rating", "performance"],
  JobSatisfaction: ["jobsatisfaction", "job_satisfaction", "satisfaction"],
  Attrition: ["attrition", "attritionstatus", "leftcompany", "status"],
  WorkLifeBalance: ["worklifebalance", "work_life_balance", "wlb"],
  YearsExperience: ["yearsexperience", "totalworkingyears", "yearsatcompany"],
  TasksAssigned: ["tasksassigned", "tasks_assigned"],
  TasksCompleted: ["taskscompleted", "tasks_completed"],
  LoggedHours: ["loggedhours", "logged_hours", "workinghours"],
  BillableHours: ["billablehours", "billable_hours"],
  AbsentDays: ["absentdays", "absent_days"],
  LateDays: ["latedays", "late_days"],
  GoalAchievementPct: ["goalachievementpct", "goal_achievement_pct", "goalachievement"],
  QualityScore: ["qualityscore", "quality_score"],
  RevenueGenerated: ["revenuegenerated", "revenue_generated"],
  DepartmentBudget: ["departmentbudget", "department_budget"],
  DepartmentExpense: ["departmentexpense", "department_expense"],
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const toNumber = (value) => {
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const excelSerialToDate = (serial) => {
  if (!Number.isFinite(serial)) return null;

  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  const fractionalDay = serial - Math.floor(serial) + 0.0000001;
  const totalSeconds = Math.floor(86400 * fractionalDay);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const date = new Date(utcValue * 1000);

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours, minutes, seconds)
  );
};

const toDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "number") {
    return excelSerialToDate(value);
  }

  const raw = String(value || "").trim();
  if (!raw) return null;

  const numeric = Number(raw);
  if (Number.isFinite(numeric) && /^[0-9]+(?:\.[0-9]+)?$/.test(raw)) {
    return excelSerialToDate(numeric);
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseAttrition = (value) => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (["yes", "y", "true", "1", "attrited", "left", "terminated"].includes(normalized)) {
    return true;
  }

  if (["no", "n", "false", "0", "active", "retained", "stay"].includes(normalized)) {
    return false;
  }

  return null;
};

const formatDepartment = (value) => {
  const text = String(value || "").trim();
  if (!text) return "Unassigned";

  return text
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const buildHeaderMap = (rows) => {
  const headers = Object.keys(rows[0] || {});
  const normalizedLookup = new Map();

  headers.forEach((header) => {
    normalizedLookup.set(normalizeHeader(header), header);
  });

  const headerMap = {};

  Object.entries(FIELD_ALIASES).forEach(([canonicalField, aliases]) => {
    const matchedAlias = aliases.find((alias) => normalizedLookup.has(normalizeHeader(alias)));

    if (matchedAlias) {
      headerMap[canonicalField] = normalizedLookup.get(normalizeHeader(matchedAlias));
    }
  });

  return headerMap;
};

const isRowEmpty = (row, headerMap) =>
  REQUIRED_DATASET_FIELDS.every((field) => {
    const key = headerMap[field];
    const value = key ? row[key] : "";
    return String(value ?? "").trim() === "";
  });

const mapPreviewRows = (rows, headerMap) =>
  rows.slice(0, 10).map((row) => ({
    Employee_ID: row[headerMap.Employee_ID] || "",
    Department: row[headerMap.Department] || "",
    JobRole: row[headerMap.JobRole] || "",
    Age: row[headerMap.Age] || "",
    MonthlyIncome: row[headerMap.MonthlyIncome] || "",
    PerformanceRating: row[headerMap.PerformanceRating] || "",
    JobSatisfaction: row[headerMap.JobSatisfaction] || "",
    Attrition: row[headerMap.Attrition] || "",
  }));

const mapEmployeePreviewRows = (employees) =>
  employees.slice(0, 10).map((employee) => ({
    Employee_ID: employee.employeeId,
    Department: employee.department,
    JobRole: employee.jobRole,
    Age: employee.age,
    MonthlyIncome: employee.monthlyIncome,
    PerformanceRating: employee.performanceRating,
    JobSatisfaction: employee.jobSatisfaction,
    Attrition: employee.attrition ? "Yes" : "No",
  }));

export const parseDatasetBuffer = async (fileBuffer, extension) => {
  if (extension === "csv") {
    const text = fileBuffer.toString("utf8");
    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (result.errors?.length) {
      throw new Error("CSV parsing failed.");
    }

    return result.data || [];
  }

  if (extension === "xlsx") {
    const workbook = await loadXlsxWorkbook(fileBuffer);
    const [firstSheetName] = workbook.sheetNames;

    return firstSheetName ? workbook.sheets[firstSheetName] || [] : [];
  }

  throw new Error("Unsupported file type.");
};

export const normalizeRowsToEmployees = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      employees: [],
      previewRows: [],
      issues: ["Dataset is empty. Upload a CSV or Excel file with employee records."],
      blocking: true,
    };
  }

  const headerMap = buildHeaderMap(rows);
  const missingFields = REQUIRED_DATASET_FIELDS.filter((field) => !headerMap[field]);

  if (missingFields.length) {
    return {
      employees: [],
      previewRows: mapPreviewRows(rows, {
        Employee_ID: headerMap.Employee_ID,
        Department: headerMap.Department,
        JobRole: headerMap.JobRole,
        Age: headerMap.Age,
        MonthlyIncome: headerMap.MonthlyIncome,
        PerformanceRating: headerMap.PerformanceRating,
        JobSatisfaction: headerMap.JobSatisfaction,
        Attrition: headerMap.Attrition,
      }),
      issues: [
        `Missing required field(s): ${missingFields.join(", ")}.`,
        "Please include all required HR columns and upload again.",
      ],
      blocking: true,
    };
  }

  const employees = [];
  let invalidRows = 0;

  rows.forEach((row, index) => {
    if (isRowEmpty(row, headerMap)) {
      return;
    }

    const employeeId = String(row[headerMap.Employee_ID] || "").trim();
    const department = formatDepartment(row[headerMap.Department]);
    const jobRole = String(row[headerMap.JobRole] || "").trim();

    const age = toNumber(row[headerMap.Age]);
    const monthlyIncome = toNumber(row[headerMap.MonthlyIncome]);
    const performanceRating = toNumber(row[headerMap.PerformanceRating]);
    const jobSatisfaction = toNumber(row[headerMap.JobSatisfaction]);
    const attrition = parseAttrition(row[headerMap.Attrition]);

    const workLifeBalance = headerMap.WorkLifeBalance
      ? toNumber(row[headerMap.WorkLifeBalance])
      : null;
    const yearsExperience = headerMap.YearsExperience
      ? toNumber(row[headerMap.YearsExperience])
      : null;
    const snapshotDate = headerMap.SnapshotDate
      ? toDate(row[headerMap.SnapshotDate])
      : null;

    const tasksAssigned = headerMap.TasksAssigned ? toNumber(row[headerMap.TasksAssigned]) : null;
    const tasksCompleted = headerMap.TasksCompleted ? toNumber(row[headerMap.TasksCompleted]) : null;
    const loggedHours = headerMap.LoggedHours ? toNumber(row[headerMap.LoggedHours]) : null;
    const billableHours = headerMap.BillableHours ? toNumber(row[headerMap.BillableHours]) : null;
    const absentDays = headerMap.AbsentDays ? toNumber(row[headerMap.AbsentDays]) : null;
    const lateDays = headerMap.LateDays ? toNumber(row[headerMap.LateDays]) : null;
    const goalAchievementPct = headerMap.GoalAchievementPct
      ? toNumber(row[headerMap.GoalAchievementPct])
      : null;
    const qualityScore = headerMap.QualityScore ? toNumber(row[headerMap.QualityScore]) : null;
    const revenueGenerated = headerMap.RevenueGenerated
      ? toNumber(row[headerMap.RevenueGenerated])
      : null;
    const departmentBudget = headerMap.DepartmentBudget
      ? toNumber(row[headerMap.DepartmentBudget])
      : null;
    const departmentExpense = headerMap.DepartmentExpense
      ? toNumber(row[headerMap.DepartmentExpense])
      : null;

    const isValid =
      employeeId &&
      department &&
      jobRole &&
      age !== null &&
      monthlyIncome !== null &&
      performanceRating !== null &&
      jobSatisfaction !== null &&
      attrition !== null;

    if (!isValid) {
      invalidRows += 1;
      return;
    }

    const safeAge = clamp(Math.round(age), 18, 70);
    const safeExperience =
      yearsExperience === null ? clamp(safeAge - 22, 0, 45) : clamp(Math.round(yearsExperience), 0, 45);

    const safeDate = snapshotDate || new Date(Date.now() - index * 24 * 60 * 60 * 1000);

    employees.push({
      employeeId,
      department,
      jobRole,
      age: safeAge,
      monthlyIncome: Math.max(0, Math.round(monthlyIncome)),
      performanceRating: clamp(Number(performanceRating.toFixed(2)), 1, 5),
      jobSatisfaction: clamp(Number(jobSatisfaction.toFixed(2)), 1, 5),
      attrition,
      workLifeBalance:
        workLifeBalance === null ? 3.4 : clamp(Number(workLifeBalance.toFixed(2)), 1, 5),
      yearsExperience: safeExperience,
      snapshotDate: safeDate,
      tasksAssigned: tasksAssigned === null ? 0 : Math.max(0, Math.round(tasksAssigned)),
      tasksCompleted: tasksCompleted === null ? 0 : Math.max(0, Math.round(tasksCompleted)),
      loggedHours: loggedHours === null ? 0 : Math.max(0, Math.round(loggedHours)),
      billableHours: billableHours === null ? 0 : Math.max(0, Math.round(billableHours)),
      absentDays: absentDays === null ? 0 : Math.max(0, Math.round(absentDays)),
      lateDays: lateDays === null ? 0 : Math.max(0, Math.round(lateDays)),
      goalAchievementPct:
        goalAchievementPct === null ? 0 : clamp(Number(goalAchievementPct.toFixed(2)), 0, 100),
      qualityScore: qualityScore === null ? 0 : clamp(Number(qualityScore.toFixed(2)), 0, 100),
      revenueGenerated: revenueGenerated === null ? 0 : Math.max(0, Math.round(revenueGenerated)),
      departmentBudget: departmentBudget === null ? 0 : Math.max(0, Math.round(departmentBudget)),
      departmentExpense: departmentExpense === null ? 0 : Math.max(0, Math.round(departmentExpense)),
    });
  });

  if (!employees.length) {
    return {
      employees: [],
      previewRows: mapPreviewRows(rows, headerMap),
      issues: [
        "No valid rows were found after validation.",
        "Ensure numeric fields contain numbers and Attrition values are Yes/No.",
      ],
      blocking: true,
    };
  }

  const issues = [];
  if (invalidRows > 0) {
    issues.push(
      `${invalidRows} row${invalidRows > 1 ? "s were" : " was"} skipped because of missing or invalid values.`
    );
  }

  return {
    employees,
    previewRows: mapPreviewRows(rows, headerMap),
    issues,
    blocking: false,
  };
};

export const makePreviewRowsFromEmployees = (employees) => mapEmployeePreviewRows(employees || []);
