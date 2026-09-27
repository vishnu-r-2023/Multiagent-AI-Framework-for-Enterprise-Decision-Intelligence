import mongoose from "mongoose";

const salesRecordSchema = new mongoose.Schema(
  {
    salesDate: { type: Date, required: true, index: true },
    department: { type: String, required: true, index: true },
    revenue: { type: Number, default: 0 },
    target: { type: Number, default: 0 },
    orders: { type: Number, default: 0 },
    unitsSold: { type: Number, default: 0 },
    customers: { type: Number, default: 0 },
    region: { type: String, default: "" },
    salesChannel: { type: String, default: "" },
    productCategory: { type: String, default: "" },
    salesRep: { type: String, default: "" },
  },
  { _id: false }
);

const marketingRecordSchema = new mongoose.Schema(
  {
    marketingDate: { type: Date, required: true, index: true },
    channel: { type: String, required: true, index: true },
    campaign: { type: String, required: true, index: true },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    visitors: { type: Number, default: 0 },
    leads: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
  },
  { _id: false }
);

const financeRecordSchema = new mongoose.Schema(
  {
    financeDate: { type: Date, required: true, index: true },
    department: { type: String, required: true, index: true },
    revenue: { type: Number, default: 0 },
    expenses: { type: Number, default: 0 },
    personnelBudget: { type: Number, default: 0 },
    trainingBudget: { type: Number, default: 0 },
    operationsBudget: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
  },
  { _id: false }
);

const operationsRecordSchema = new mongoose.Schema(
  {
    operationsDate: { type: Date, required: true, index: true },
    department: { type: String, required: true, index: true },
    processName: { type: String, required: true },
    shift: { type: String, default: "" },
    unitsPlanned: { type: Number, default: 0 },
    unitsProcessed: { type: Number, default: 0 },
    throughput: { type: Number, default: 0 },
    capacityUnits: { type: Number, default: 0 },
    utilizationPct: { type: Number, default: 0 },
    cycleTimeMinutes: { type: Number, default: 0 },
    downtimeMinutes: { type: Number, default: 0 },
    defectRatePct: { type: Number, default: 0 },
    reworkCount: { type: Number, default: 0 },
    onTimeDeliveryPct: { type: Number, default: 0 },
    slaCompliancePct: { type: Number, default: 0 },
    inventoryLevel: { type: Number, default: 0 },
    backlogVolume: { type: Number, default: 0 },
    operatingCost: { type: Number, default: 0 },
  },
  { _id: false }
);

const sheetCountsSchema = new mongoose.Schema(
  {
    hrEmployees: { type: Number, default: 0 },
    sales: { type: Number, default: 0 },
    marketing: { type: Number, default: 0 },
    finance: { type: Number, default: 0 },
    operations: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const businessDatasetSchema = new mongoose.Schema(
  {
    ownerUserId: { type: String, index: true },
    datasetId: { type: String, index: true },
    salesRecords: { type: [salesRecordSchema], default: [] },
    marketingRecords: { type: [marketingRecordSchema], default: [] },
    financeRecords: { type: [financeRecordSchema], default: [] },
    operationsRecords: { type: [operationsRecordSchema], default: [] },
    sheetCounts: { type: sheetCountsSchema, default: () => ({}) },
  },
  {
    timestamps: true,
  }
);

businessDatasetSchema.index({ ownerUserId: 1, datasetId: 1 }, { unique: true });

export const BusinessDataset = mongoose.model("BusinessDataset", businessDatasetSchema);
