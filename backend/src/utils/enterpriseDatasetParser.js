import { loadXlsxWorkbook } from "./excelWorkbook.js";
import { normalizeRowsToEmployees } from "./datasetParser.js";

export const REQUIRED_ENTERPRISE_SHEETS = Object.freeze([
  "HR_Employees",
  "Sales",
  "Marketing",
  "Finance",
  "Operations",
]);

export const ENTERPRISE_WORKBOOK_FIELDS = Object.freeze({
  HR_Employees: [
    "SnapshotDate",
    "Employee_ID",
    "Department",
    "JobRole",
    "Age",
    "MonthlyIncome",
    "PerformanceRating",
    "JobSatisfaction",
    "Attrition",
    "WorkLifeBalance",
    "YearsExperience",
    "TasksAssigned",
    "TasksCompleted",
    "LoggedHours",
    "BillableHours",
    "AbsentDays",
    "LateDays",
    "GoalAchievementPct",
    "QualityScore",
    "RevenueGenerated",
    "DepartmentBudget",
    "DepartmentExpense",
  ],
  Sales: [
    "SalesDate",
    "Department",
    "Revenue",
    "Target",
    "Orders",
    "UnitsSold",
    "Customers",
    "Region",
    "SalesChannel",
    "ProductCategory",
    "SalesRep",
  ],
  Marketing: [
    "MarketingDate",
    "Channel",
    "Campaign",
    "Impressions",
    "Clicks",
    "Visitors",
    "Leads",
    "Conversions",
    "Spend",
    "Revenue",
  ],
  Finance: [
    "FinanceDate",
    "Department",
    "Revenue",
    "Expenses",
    "PersonnelBudget",
    "TrainingBudget",
    "OperationsBudget",
    "NetProfit",
  ],
  Operations: [
    "OperationsDate",
    "Department",
    "ProcessName",
    "Shift",
    "UnitsPlanned",
    "UnitsProcessed",
    "Throughput",
    "CapacityUnits",
    "UtilizationPct",
    "CycleTimeMinutes",
    "DowntimeMinutes",
    "DefectRatePct",
    "ReworkCount",
    "OnTimeDeliveryPct",
    "SLACompliancePct",
    "InventoryLevel",
    "BacklogVolume",
    "OperatingCost",
  ],
});

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

  return normalizedLookup;
};

const resolveSheetName = (workbook, sheetName) =>
  workbook.sheetNames.find((name) => normalizeHeader(name) === normalizeHeader(sheetName)) || null;

const getSheetRows = (workbook, sheetName) => {
  const resolvedSheetName = resolveSheetName(workbook, sheetName);
  if (!resolvedSheetName) {
    return [];
  }

  return workbook.sheets[resolvedSheetName] || [];
};

const validateSheetHeaders = (rows, sheetName) => {
  const headers = buildHeaderMap(rows);
  const requiredFields = ENTERPRISE_WORKBOOK_FIELDS[sheetName] || [];
  const missingFields = requiredFields.filter((field) => !headers.has(normalizeHeader(field)));

  return {
    headers,
    missingFields,
  };
};

const makePreviewRows = (rows, fields) =>
  rows.slice(0, 10).map((row) =>
    fields.reduce((preview, field) => {
      preview[field] = row[field] ?? "";
      return preview;
    }, {})
  );

const normalizeSalesRows = (rows) => {
  const { headers, missingFields } = validateSheetHeaders(rows, "Sales");
  if (missingFields.length) {
    return {
      records: [],
      issues: [`Sales sheet is missing field(s): ${missingFields.join(", ")}.`],
      blocking: true,
    };
  }

  const records = [];
  let invalidRows = 0;

  rows.forEach((row) => {
    const salesDate = toDate(row[headers.get(normalizeHeader("SalesDate"))]);
    const department = formatDepartment(row[headers.get(normalizeHeader("Department"))]);
    const revenue = toNumber(row[headers.get(normalizeHeader("Revenue"))]);
    const target = toNumber(row[headers.get(normalizeHeader("Target"))]);

    if (!salesDate || department === "Unassigned" || revenue === null || target === null) {
      invalidRows += 1;
      return;
    }

    records.push({
      salesDate,
      department,
      revenue: Math.max(0, Math.round(revenue)),
      target: Math.max(0, Math.round(target)),
      orders: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("Orders"))]) || 0)),
      unitsSold: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("UnitsSold"))]) || 0)),
      customers: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("Customers"))]) || 0)),
      region: String(row[headers.get(normalizeHeader("Region"))] || "").trim(),
      salesChannel: String(row[headers.get(normalizeHeader("SalesChannel"))] || "").trim(),
      productCategory: String(row[headers.get(normalizeHeader("ProductCategory"))] || "").trim(),
      salesRep: String(row[headers.get(normalizeHeader("SalesRep"))] || "").trim(),
    });
  });

  return {
    records,
    issues:
      invalidRows > 0
        ? [`${invalidRows} Sales row${invalidRows > 1 ? "s were" : " was"} skipped during validation.`]
        : [],
    blocking: records.length === 0,
  };
};

const normalizeMarketingRows = (rows) => {
  const { headers, missingFields } = validateSheetHeaders(rows, "Marketing");
  if (missingFields.length) {
    return {
      records: [],
      issues: [`Marketing sheet is missing field(s): ${missingFields.join(", ")}.`],
      blocking: true,
    };
  }

  const records = [];
  let invalidRows = 0;

  rows.forEach((row) => {
    const marketingDate = toDate(row[headers.get(normalizeHeader("MarketingDate"))]);
    const channel = String(row[headers.get(normalizeHeader("Channel"))] || "").trim();
    const campaign = String(row[headers.get(normalizeHeader("Campaign"))] || "").trim();

    if (!marketingDate || !channel || !campaign) {
      invalidRows += 1;
      return;
    }

    records.push({
      marketingDate,
      channel,
      campaign,
      impressions: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("Impressions"))]) || 0)),
      clicks: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("Clicks"))]) || 0)),
      visitors: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("Visitors"))]) || 0)),
      leads: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("Leads"))]) || 0)),
      conversions: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("Conversions"))]) || 0)),
      spend: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("Spend"))]) || 0)),
      revenue: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("Revenue"))]) || 0)),
    });
  });

  return {
    records,
    issues:
      invalidRows > 0
        ? [`${invalidRows} Marketing row${invalidRows > 1 ? "s were" : " was"} skipped during validation.`]
        : [],
    blocking: records.length === 0,
  };
};

const normalizeFinanceRows = (rows) => {
  const { headers, missingFields } = validateSheetHeaders(rows, "Finance");
  if (missingFields.length) {
    return {
      records: [],
      issues: [`Finance sheet is missing field(s): ${missingFields.join(", ")}.`],
      blocking: true,
    };
  }

  const records = [];
  let invalidRows = 0;

  rows.forEach((row) => {
    const financeDate = toDate(row[headers.get(normalizeHeader("FinanceDate"))]);
    const department = formatDepartment(row[headers.get(normalizeHeader("Department"))]);

    if (!financeDate || department === "Unassigned") {
      invalidRows += 1;
      return;
    }

    records.push({
      financeDate,
      department,
      revenue: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("Revenue"))]) || 0)),
      expenses: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("Expenses"))]) || 0)),
      personnelBudget: Math.max(
        0,
        Math.round(toNumber(row[headers.get(normalizeHeader("PersonnelBudget"))]) || 0)
      ),
      trainingBudget: Math.max(
        0,
        Math.round(toNumber(row[headers.get(normalizeHeader("TrainingBudget"))]) || 0)
      ),
      operationsBudget: Math.max(
        0,
        Math.round(toNumber(row[headers.get(normalizeHeader("OperationsBudget"))]) || 0)
      ),
      netProfit: Math.round(toNumber(row[headers.get(normalizeHeader("NetProfit"))]) || 0),
    });
  });

  return {
    records,
    issues:
      invalidRows > 0
        ? [`${invalidRows} Finance row${invalidRows > 1 ? "s were" : " was"} skipped during validation.`]
        : [],
    blocking: records.length === 0,
  };
};

const normalizeOperationsRows = (rows) => {
  const { headers, missingFields } = validateSheetHeaders(rows, "Operations");
  if (missingFields.length) {
    return {
      records: [],
      issues: [`Operations sheet is missing field(s): ${missingFields.join(", ")}.`],
      blocking: true,
    };
  }

  const records = [];
  let invalidRows = 0;

  rows.forEach((row) => {
    const operationsDate = toDate(row[headers.get(normalizeHeader("OperationsDate"))]);
    const department = formatDepartment(row[headers.get(normalizeHeader("Department"))]);
    const processName = String(row[headers.get(normalizeHeader("ProcessName"))] || "").trim();

    if (!operationsDate || department === "Unassigned" || !processName) {
      invalidRows += 1;
      return;
    }

    records.push({
      operationsDate,
      department,
      processName,
      shift: String(row[headers.get(normalizeHeader("Shift"))] || "").trim(),
      unitsPlanned: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("UnitsPlanned"))]) || 0)),
      unitsProcessed: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("UnitsProcessed"))]) || 0)),
      throughput: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("Throughput"))]) || 0)),
      capacityUnits: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("CapacityUnits"))]) || 0)),
      utilizationPct: Math.max(0, Number((toNumber(row[headers.get(normalizeHeader("UtilizationPct"))]) || 0).toFixed(2))),
      cycleTimeMinutes: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("CycleTimeMinutes"))]) || 0)),
      downtimeMinutes: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("DowntimeMinutes"))]) || 0)),
      defectRatePct: Math.max(0, Number((toNumber(row[headers.get(normalizeHeader("DefectRatePct"))]) || 0).toFixed(2))),
      reworkCount: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("ReworkCount"))]) || 0)),
      onTimeDeliveryPct: Math.max(0, Number((toNumber(row[headers.get(normalizeHeader("OnTimeDeliveryPct"))]) || 0).toFixed(2))),
      slaCompliancePct: Math.max(0, Number((toNumber(row[headers.get(normalizeHeader("SLACompliancePct"))]) || 0).toFixed(2))),
      inventoryLevel: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("InventoryLevel"))]) || 0)),
      backlogVolume: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("BacklogVolume"))]) || 0)),
      operatingCost: Math.max(0, Math.round(toNumber(row[headers.get(normalizeHeader("OperatingCost"))]) || 0)),
    });
  });

  return {
    records,
    issues:
      invalidRows > 0
        ? [`${invalidRows} Operations row${invalidRows > 1 ? "s were" : " was"} skipped during validation.`]
        : [],
    blocking: records.length === 0,
  };
};

export const parseEnterpriseWorkbookBuffer = async (fileBuffer, extension) => {
  if (extension !== "xlsx") {
    return null;
  }

  return loadXlsxWorkbook(fileBuffer);
};

export const looksLikeEnterpriseWorkbook = (workbook) =>
  REQUIRED_ENTERPRISE_SHEETS.some((sheetName) => Boolean(resolveSheetName(workbook, sheetName)));

export const normalizeEnterpriseWorkbook = (workbook) => {
  const missingSheets = REQUIRED_ENTERPRISE_SHEETS.filter((sheetName) => !resolveSheetName(workbook, sheetName));

  if (missingSheets.length) {
    return {
      blocking: true,
      issues: [`Workbook is missing sheet(s): ${missingSheets.join(", ")}.`],
      previewRows: [],
      employees: [],
      salesRecords: [],
      marketingRecords: [],
      financeRecords: [],
      operationsRecords: [],
      sheetCounts: {
        hrEmployees: 0,
        sales: 0,
        marketing: 0,
        finance: 0,
        operations: 0,
        total: 0,
      },
    };
  }

  const hrRows = getSheetRows(workbook, "HR_Employees");
  const hrParsed = normalizeRowsToEmployees(hrRows);
  if (hrParsed.blocking) {
    return {
      blocking: true,
      issues: hrParsed.issues,
      previewRows: hrParsed.previewRows,
      employees: [],
      salesRecords: [],
      marketingRecords: [],
      financeRecords: [],
      operationsRecords: [],
      sheetCounts: {
        hrEmployees: 0,
        sales: 0,
        marketing: 0,
        finance: 0,
        operations: 0,
        total: 0,
      },
    };
  }

  const salesParsed = normalizeSalesRows(getSheetRows(workbook, "Sales"));
  const marketingParsed = normalizeMarketingRows(getSheetRows(workbook, "Marketing"));
  const financeParsed = normalizeFinanceRows(getSheetRows(workbook, "Finance"));
  const operationsParsed = normalizeOperationsRows(getSheetRows(workbook, "Operations"));

  const blockingResult = [salesParsed, marketingParsed, financeParsed, operationsParsed].find(
    (result) => result.blocking
  );

  if (blockingResult) {
    return {
      blocking: true,
      issues: [
        ...hrParsed.issues,
        ...salesParsed.issues,
        ...marketingParsed.issues,
        ...financeParsed.issues,
        ...operationsParsed.issues,
      ].filter(Boolean),
      previewRows: hrParsed.previewRows,
      employees: [],
      salesRecords: [],
      marketingRecords: [],
      financeRecords: [],
      operationsRecords: [],
      sheetCounts: {
        hrEmployees: 0,
        sales: 0,
        marketing: 0,
        finance: 0,
        operations: 0,
        total: 0,
      },
    };
  }

  const sheetCounts = {
    hrEmployees: hrParsed.employees.length,
    sales: salesParsed.records.length,
    marketing: marketingParsed.records.length,
    finance: financeParsed.records.length,
    operations: operationsParsed.records.length,
    total:
      hrParsed.employees.length +
      salesParsed.records.length +
      marketingParsed.records.length +
      financeParsed.records.length +
      operationsParsed.records.length,
  };

  return {
    blocking: false,
    issues: [
      ...hrParsed.issues,
      ...salesParsed.issues,
      ...marketingParsed.issues,
      ...financeParsed.issues,
      ...operationsParsed.issues,
    ].filter(Boolean),
    previewRows: hrParsed.previewRows.length
      ? hrParsed.previewRows
      : makePreviewRows(hrRows, ENTERPRISE_WORKBOOK_FIELDS.HR_Employees),
    employees: hrParsed.employees,
    salesRecords: salesParsed.records,
    marketingRecords: marketingParsed.records,
    financeRecords: financeParsed.records,
    operationsRecords: operationsParsed.records,
    sheetCounts,
  };
};
