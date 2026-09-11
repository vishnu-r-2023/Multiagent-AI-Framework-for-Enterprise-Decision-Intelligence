import express from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { BusinessDataset } from "../models/BusinessDataset.js";
import { Employee } from "../models/Employee.js";
import { DatasetMeta } from "../models/DatasetMeta.js";
import {
  makePreviewRowsFromEmployees,
  normalizeRowsToEmployees,
  parseDatasetBuffer,
  REQUIRED_DATASET_FIELDS,
} from "../utils/datasetParser.js";
import {
  looksLikeEnterpriseWorkbook,
  normalizeEnterpriseWorkbook,
  parseEnterpriseWorkbookBuffer,
  REQUIRED_ENTERPRISE_SHEETS,
} from "../utils/enterpriseDatasetParser.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

const DEFAULT_META = {
  datasetId: null,
  fileName: "No dataset uploaded",
  uploadedAt: new Date().toISOString(),
  recordCount: 0,
  source: "empty",
  validationMessages: [],
  isActive: false,
  sheetCounts: {
    hrEmployees: 0,
    sales: 0,
    marketing: 0,
    finance: 0,
    operations: 0,
    total: 0,
  },
};

const getLegacyMetaKey = (userId) => `active:${userId}`;
const getDatasetMetaKey = (userId, datasetId) => `dataset:${userId}:${datasetId}`;

const getOrphanDatasetQuery = (userId) => ({
  ownerUserId: userId,
  $or: [{ datasetId: { $exists: false } }, { datasetId: null }, { datasetId: "" }],
});

const toClientEmployee = (employee) => ({
  employeeId: employee.employeeId,
  department: employee.department,
  jobRole: employee.jobRole,
  age: employee.age,
  monthlyIncome: employee.monthlyIncome,
  performanceRating: employee.performanceRating,
  jobSatisfaction: employee.jobSatisfaction,
  attrition: employee.attrition,
  workLifeBalance: employee.workLifeBalance,
  yearsExperience: employee.yearsExperience,
  recordDate: employee.snapshotDate,
  tasksAssigned: employee.tasksAssigned,
  tasksCompleted: employee.tasksCompleted,
  loggedHours: employee.loggedHours,
  billableHours: employee.billableHours,
  absentDays: employee.absentDays,
  lateDays: employee.lateDays,
  goalAchievementPct: employee.goalAchievementPct,
  qualityScore: employee.qualityScore,
  revenueGenerated: employee.revenueGenerated,
  departmentBudget: employee.departmentBudget,
  departmentExpense: employee.departmentExpense,
});

const toClientSalesRecord = (record) => ({
  salesDate: record.salesDate,
  department: record.department,
  revenue: record.revenue,
  target: record.target,
  orders: record.orders,
  unitsSold: record.unitsSold,
  customers: record.customers,
  region: record.region,
  salesChannel: record.salesChannel,
  productCategory: record.productCategory,
  salesRep: record.salesRep,
});

const toClientMarketingRecord = (record) => ({
  marketingDate: record.marketingDate,
  channel: record.channel,
  campaign: record.campaign,
  impressions: record.impressions,
  clicks: record.clicks,
  visitors: record.visitors,
  leads: record.leads,
  conversions: record.conversions,
  spend: record.spend,
  revenue: record.revenue,
});

const toClientFinanceRecord = (record) => ({
  financeDate: record.financeDate,
  department: record.department,
  revenue: record.revenue,
  expenses: record.expenses,
  personnelBudget: record.personnelBudget,
  trainingBudget: record.trainingBudget,
  operationsBudget: record.operationsBudget,
  netProfit: record.netProfit,
});

const toClientOperationsRecord = (record) => ({
  operationsDate: record.operationsDate,
  department: record.department,
  processName: record.processName,
  shift: record.shift,
  unitsPlanned: record.unitsPlanned,
  unitsProcessed: record.unitsProcessed,
  throughput: record.throughput,
  capacityUnits: record.capacityUnits,
  utilizationPct: record.utilizationPct,
  cycleTimeMinutes: record.cycleTimeMinutes,
  downtimeMinutes: record.downtimeMinutes,
  defectRatePct: record.defectRatePct,
  reworkCount: record.reworkCount,
  onTimeDeliveryPct: record.onTimeDeliveryPct,
  slaCompliancePct: record.slaCompliancePct,
  inventoryLevel: record.inventoryLevel,
  backlogVolume: record.backlogVolume,
  operatingCost: record.operatingCost,
});

const normalizeSheetCounts = (sheetCounts = {}) => ({
  hrEmployees: Number(sheetCounts.hrEmployees || 0),
  sales: Number(sheetCounts.sales || 0),
  marketing: Number(sheetCounts.marketing || 0),
  finance: Number(sheetCounts.finance || 0),
  operations: Number(sheetCounts.operations || 0),
  total: Number(sheetCounts.total || 0),
});

const toClientMeta = (meta) => {
  if (!meta) {
    return {
      ...DEFAULT_META,
      uploadedAt: new Date().toISOString(),
    };
  }

  return {
    datasetId: meta.datasetId || null,
    fileName: meta.fileName || DEFAULT_META.fileName,
    uploadedAt: meta.uploadedAt || new Date().toISOString(),
    recordCount: Number(meta.recordCount || 0),
    source: meta.source || "uploaded",
    validationMessages: meta.validationMessages || [],
    isActive: Boolean(meta.isActive),
    sheetCounts: normalizeSheetCounts(meta.sheetCounts),
  };
};

const toDatasetSummary = (meta) => ({
  datasetId: meta.datasetId || null,
  fileName: meta.fileName || DEFAULT_META.fileName,
  uploadedAt: meta.uploadedAt || new Date().toISOString(),
  recordCount: Number(meta.recordCount || 0),
  source: meta.source || "uploaded",
  isActive: Boolean(meta.isActive),
  sheetCounts: normalizeSheetCounts(meta.sheetCounts),
});

const buildResponsePayload = (state) => ({
  employees: state.clientEmployees,
  salesRecords: state.salesRecords,
  marketingRecords: state.marketingRecords,
  financeRecords: state.financeRecords,
  operationsRecords: state.operationsRecords,
  datasetMeta: state.datasetMeta,
  previewRows: makePreviewRowsFromEmployees(state.clientEmployees),
  validationMessages: state.validationMessages || [],
  requiredFields: REQUIRED_DATASET_FIELDS,
  requiredSheets: REQUIRED_ENTERPRISE_SHEETS,
  datasets: state.datasets,
  activeDatasetId: state.activeDatasetId,
});

const migrateLegacyActiveMeta = async (userId) => {
  const legacyMeta = await DatasetMeta.findOne({ key: getLegacyMetaKey(userId) });
  if (!legacyMeta) {
    return;
  }

  const datasetId = legacyMeta.datasetId || randomUUID();
  legacyMeta.key = getDatasetMetaKey(userId, datasetId);
  legacyMeta.ownerUserId = userId;
  legacyMeta.datasetId = datasetId;
  legacyMeta.isActive = true;
  legacyMeta.source = legacyMeta.source || (Number(legacyMeta.recordCount || 0) > 0 ? "uploaded" : "empty");
  legacyMeta.sheetCounts = normalizeSheetCounts({
    ...(legacyMeta.sheetCounts || {}),
    hrEmployees: Number(legacyMeta.recordCount || 0),
    total: Number(legacyMeta.recordCount || 0),
  });

  await legacyMeta.save();
  await Employee.updateMany(getOrphanDatasetQuery(userId), { $set: { datasetId } });
  await DatasetMeta.updateMany(
    {
      ownerUserId: userId,
      _id: { $ne: legacyMeta._id },
    },
    { $set: { isActive: false } }
  );
};

const getActiveDatasetMeta = async (userId) => {
  await migrateLegacyActiveMeta(userId);

  const activeCandidates = await DatasetMeta.find({ ownerUserId: userId, isActive: true })
    .sort({ uploadedAt: -1, createdAt: -1 })
    .lean();

  if (activeCandidates.length > 1) {
    const [winner, ...others] = activeCandidates;
    await DatasetMeta.updateMany(
      {
        ownerUserId: userId,
        _id: { $in: others.map((meta) => meta._id) },
      },
      { $set: { isActive: false } }
    );
    return winner;
  }

  if (activeCandidates.length === 1) {
    return activeCandidates[0];
  }

  const newestMeta = await DatasetMeta.findOne({ ownerUserId: userId })
    .sort({ uploadedAt: -1, createdAt: -1 })
    .lean();

  if (newestMeta) {
    await DatasetMeta.updateOne({ _id: newestMeta._id }, { $set: { isActive: true } });
    return { ...newestMeta, isActive: true };
  }

  const orphanCount = await Employee.countDocuments(getOrphanDatasetQuery(userId));
  if (orphanCount === 0) {
    return null;
  }

  const datasetId = randomUUID();
  await Employee.updateMany(getOrphanDatasetQuery(userId), { $set: { datasetId } });

  const recoveredMeta = await DatasetMeta.create({
    key: getDatasetMetaKey(userId, datasetId),
    ownerUserId: userId,
    datasetId,
    isActive: true,
    fileName: "Recovered dataset",
    uploadedAt: new Date(),
    recordCount: orphanCount,
    source: "uploaded",
    validationMessages: ["Recovered metadata from existing employee records."],
    sheetCounts: {
      hrEmployees: orphanCount,
      sales: 0,
      marketing: 0,
      finance: 0,
      operations: 0,
      total: orphanCount,
    },
  });

  return recoveredMeta.toObject();
};

const getDatasets = async (userId) => {
  const metas = await DatasetMeta.find({ ownerUserId: userId })
    .sort({ uploadedAt: -1, createdAt: -1 })
    .lean();

  const seen = new Set();
  const datasets = [];

  metas.forEach((meta) => {
    if (!meta.datasetId || seen.has(meta.datasetId)) {
      return;
    }
    seen.add(meta.datasetId);
    datasets.push(toDatasetSummary(meta));
  });

  return datasets;
};

const getAnalyticsState = async (userId) => {
  const activeMeta = await getActiveDatasetMeta(userId);

  let employees = [];
  let businessDataset = null;
  if (activeMeta?.datasetId) {
    employees = await Employee.find({
      ownerUserId: userId,
      datasetId: activeMeta.datasetId,
    })
      .sort({ snapshotDate: -1 })
      .lean();

    if (!employees.length) {
      const orphanCount = await Employee.countDocuments(getOrphanDatasetQuery(userId));
      if (orphanCount > 0) {
        await Employee.updateMany(getOrphanDatasetQuery(userId), {
          $set: { datasetId: activeMeta.datasetId },
        });
        employees = await Employee.find({
          ownerUserId: userId,
          datasetId: activeMeta.datasetId,
        })
          .sort({ snapshotDate: -1 })
          .lean();
      }
    }

    businessDataset = await BusinessDataset.findOne({
      ownerUserId: userId,
      datasetId: activeMeta.datasetId,
    }).lean();

    const computedSheetCounts = businessDataset?.sheetCounts
      ? normalizeSheetCounts(businessDataset.sheetCounts)
      : normalizeSheetCounts({
          ...(activeMeta.sheetCounts || {}),
          hrEmployees: employees.length,
          total: employees.length,
        });
    const computedRecordCount = computedSheetCounts.total || employees.length;

    if (
      Number(activeMeta.recordCount || 0) !== computedRecordCount ||
      JSON.stringify(normalizeSheetCounts(activeMeta.sheetCounts)) !== JSON.stringify(computedSheetCounts)
    ) {
      await DatasetMeta.updateOne(
        { ownerUserId: userId, datasetId: activeMeta.datasetId },
        { $set: { recordCount: computedRecordCount, sheetCounts: computedSheetCounts } }
      );
      activeMeta.recordCount = computedRecordCount;
      activeMeta.sheetCounts = computedSheetCounts;
    }
  }

  const clientEmployees = employees.map(toClientEmployee);
  const salesRecords = (businessDataset?.salesRecords || []).map(toClientSalesRecord);
  const marketingRecords = (businessDataset?.marketingRecords || []).map(toClientMarketingRecord);
  const financeRecords = (businessDataset?.financeRecords || []).map(toClientFinanceRecord);
  const operationsRecords = (businessDataset?.operationsRecords || []).map(toClientOperationsRecord);
  const datasetMeta = toClientMeta(activeMeta);
  const datasets = await getDatasets(userId);

  return {
    clientEmployees,
    salesRecords,
    marketingRecords,
    financeRecords,
    operationsRecords,
    datasetMeta,
    validationMessages: datasetMeta.validationMessages || [],
    datasets,
    activeDatasetId: datasetMeta.datasetId || null,
  };
};

router.get("/bootstrap", async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const state = await getAnalyticsState(userId);
    res.json(buildResponsePayload(state));
  } catch (error) {
    next(error);
  }
});

router.post("/dataset/upload", upload.single("file"), async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        issues: ["No file uploaded. Please select a CSV or Excel file."],
      });
    }

    const extension = String(req.file.originalname || "")
      .split(".")
      .pop()
      ?.toLowerCase();

    if (extension === "xls") {
      return res.status(400).json({
        success: false,
        issues: ["Legacy `.xls` files are no longer supported. Please upload a `.csv` or `.xlsx` file."],
      });
    }

    if (!["csv", "xlsx"].includes(extension || "")) {
      return res.status(400).json({
        success: false,
        issues: ["Unsupported file type. Please upload a `.csv` or `.xlsx` file."],
      });
    }

    let parsed;
    const legacyParsed = (result) => ({
      blocking: result.blocking,
      issues: result.issues,
      previewRows: result.previewRows,
      employees: result.employees,
      salesRecords: [],
      marketingRecords: [],
      financeRecords: [],
      operationsRecords: [],
      sheetCounts: {
        hrEmployees: result.employees.length,
        sales: 0,
        marketing: 0,
        finance: 0,
        operations: 0,
        total: result.employees.length,
      },
      source: "uploaded",
    });

    if (extension === "xlsx") {
      const workbook = await parseEnterpriseWorkbookBuffer(req.file.buffer, extension);
      if (workbook && looksLikeEnterpriseWorkbook(workbook)) {
        parsed = {
          ...normalizeEnterpriseWorkbook(workbook),
          source: "enterprise-workbook",
        };
      }
    }

    if (!parsed) {
      const rows = await parseDatasetBuffer(req.file.buffer, extension);
      parsed = legacyParsed(normalizeRowsToEmployees(rows));
    }

    if (parsed.blocking) {
      return res.status(400).json({
        success: false,
        issues: parsed.issues,
        previewRows: parsed.previewRows,
        count: 0,
      });
    }

    const datasetId = randomUUID();

    await DatasetMeta.updateMany(
      {
        ownerUserId: userId,
        isActive: true,
      },
      { $set: { isActive: false } }
    );

    await Employee.insertMany(
      parsed.employees.map((employee) => ({
        ...employee,
        ownerUserId: userId,
        datasetId,
      })),
      { ordered: false }
    );

    if (
      parsed.salesRecords.length ||
      parsed.marketingRecords.length ||
      parsed.financeRecords.length ||
      parsed.operationsRecords.length
    ) {
      await BusinessDataset.create({
        ownerUserId: userId,
        datasetId,
        salesRecords: parsed.salesRecords,
        marketingRecords: parsed.marketingRecords,
        financeRecords: parsed.financeRecords,
        operationsRecords: parsed.operationsRecords,
        sheetCounts: parsed.sheetCounts,
      });
    }

    await DatasetMeta.create({
      key: getDatasetMetaKey(userId, datasetId),
      ownerUserId: userId,
      datasetId,
      isActive: true,
      fileName: req.file.originalname,
      uploadedAt: new Date(),
      recordCount: parsed.sheetCounts.total,
      source: parsed.source || "uploaded",
      validationMessages: parsed.issues,
      sheetCounts: parsed.sheetCounts,
    });

    const state = await getAnalyticsState(userId);

    res.json({
      success: true,
      issues: parsed.issues,
      count: state.datasetMeta.recordCount,
      ...buildResponsePayload(state),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Unable to read the Excel workbook. Save the file as .xlsx and try again."
    ) {
      return res.status(400).json({
        success: false,
        issues: [error.message],
      });
    }

    return next(error);
  }
});

router.post("/dataset/switch", async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const datasetId = String(req.body?.datasetId || "").trim();

    if (!datasetId) {
      return res.status(400).json({
        success: false,
        message: "datasetId is required.",
      });
    }

    const targetDataset = await DatasetMeta.findOne({
      ownerUserId: userId,
      datasetId,
    }).lean();

    if (!targetDataset) {
      return res.status(404).json({
        success: false,
        message: "Dataset not found.",
      });
    }

    await DatasetMeta.updateMany(
      {
        ownerUserId: userId,
        isActive: true,
      },
      { $set: { isActive: false } }
    );

    await DatasetMeta.updateOne(
      {
        ownerUserId: userId,
        datasetId,
      },
      { $set: { isActive: true } }
    );

    const state = await getAnalyticsState(userId);

    res.json({
      success: true,
      ...buildResponsePayload(state),
    });
  } catch (error) {
    next(error);
  }
});

const deleteDatasetById = async (userId, datasetId) => {
  const targetDataset = await DatasetMeta.findOne({
    ownerUserId: userId,
    datasetId,
  }).lean();

  if (!targetDataset) {
    return false;
  }

  await Promise.all([
    Employee.deleteMany({
      ownerUserId: userId,
      datasetId,
    }),
    BusinessDataset.deleteMany({
      ownerUserId: userId,
      datasetId,
    }),
    DatasetMeta.deleteMany({
      ownerUserId: userId,
      datasetId,
    }),
  ]);

  if (targetDataset.isActive) {
    const nextDataset = await DatasetMeta.findOne({ ownerUserId: userId })
      .sort({ uploadedAt: -1, createdAt: -1 })
      .lean();

    if (nextDataset?.datasetId) {
      await DatasetMeta.updateMany(
        {
          ownerUserId: userId,
          isActive: true,
        },
        { $set: { isActive: false } }
      );

      await DatasetMeta.updateOne(
        {
          ownerUserId: userId,
          datasetId: nextDataset.datasetId,
        },
        { $set: { isActive: true } }
      );
    }
  }

  return true;
};

router.delete("/dataset/:datasetId", async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const datasetId = String(req.params.datasetId || "").trim();

    if (!datasetId) {
      return res.status(400).json({
        success: false,
        message: "datasetId is required.",
      });
    }

    const wasDeleted = await deleteDatasetById(userId, datasetId);
    if (!wasDeleted) {
      return res.status(404).json({
        success: false,
        message: "Dataset not found.",
      });
    }

    const state = await getAnalyticsState(userId);

    res.json({
      success: true,
      ...buildResponsePayload(state),
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/dataset", async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const state = await getAnalyticsState(userId);

    if (state.activeDatasetId) {
      await deleteDatasetById(userId, state.activeDatasetId);
    }

    const nextState = await getAnalyticsState(userId);

    res.json({ success: true, ...buildResponsePayload(nextState) });
  } catch (error) {
    next(error);
  }
});

export default router;
