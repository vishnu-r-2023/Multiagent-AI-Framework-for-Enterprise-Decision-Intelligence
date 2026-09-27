import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    ownerUserId: { type: String, index: true },
    datasetId: { type: String, index: true },
    employeeId: { type: String, required: true, index: true },
    department: { type: String, required: true, index: true },
    jobRole: { type: String, required: true },
    age: { type: Number, required: true },
    monthlyIncome: { type: Number, required: true },
    performanceRating: { type: Number, required: true },
    jobSatisfaction: { type: Number, required: true },
    attrition: { type: Boolean, required: true },
    workLifeBalance: { type: Number, default: 3.4 },
    yearsExperience: { type: Number, default: 0 },
    snapshotDate: { type: Date, default: Date.now, index: true },
    tasksAssigned: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    loggedHours: { type: Number, default: 0 },
    billableHours: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    lateDays: { type: Number, default: 0 },
    goalAchievementPct: { type: Number, default: 0 },
    qualityScore: { type: Number, default: 0 },
    revenueGenerated: { type: Number, default: 0 },
    departmentBudget: { type: Number, default: 0 },
    departmentExpense: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const Employee = mongoose.model("Employee", employeeSchema);
