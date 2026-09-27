import mongoose from "mongoose";

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

const datasetMetaSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    ownerUserId: { type: String, index: true },
    datasetId: { type: String, index: true },
    isActive: { type: Boolean, default: false },
    fileName: { type: String, default: "No dataset uploaded" },
    uploadedAt: { type: Date, default: Date.now },
    recordCount: { type: Number, default: 0 },
    source: { type: String, default: "empty" },
    validationMessages: [{ type: String }],
    sheetCounts: { type: sheetCountsSchema, default: () => ({}) },
  },
  {
    timestamps: true,
  }
);

export const DatasetMeta = mongoose.model("DatasetMeta", datasetMetaSchema);
