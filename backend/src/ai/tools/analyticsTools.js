import { BusinessDataset } from "../../models/BusinessDataset.js";
import { DatasetMeta } from "../../models/DatasetMeta.js";
import { Employee } from "../../models/Employee.js";

const round = (value, digits = 1) => Number(Number(value || 0).toFixed(digits));
const average = (values) => (values.length ? values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length : 0);
const sum = (values) => values.reduce((total, value) => total + Number(value || 0), 0);
const percent = (part, total) => (total ? (part / total) * 100 : 0);
const formatCurrency = (value) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(value || 0));
const toLabel = (value) => String(value || "Unspecified").trim() || "Unspecified";

const groupBy = (records, getKey) =>
  records.reduce((groups, record) => {
    const key = toLabel(getKey(record));
    groups[key] = groups[key] || [];
    groups[key].push(record);
    return groups;
  }, {});

const monthlyTotals = (records, dateField, valueField) => {
  const buckets = groupBy(records, (record) => {
    const date = new Date(record?.[dateField]);
    return Number.isNaN(date.getTime()) ? "Unknown" : `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  });

  return Object.entries(buckets)
    .filter(([month]) => month !== "Unknown")
    .map(([month, rows]) => ({ month, value: round(sum(rows.map((row) => row[valueField])), 2) }))
    .sort((left, right) => left.month.localeCompare(right.month));
};

export const calculateTrend = (points) => {
  if (!Array.isArray(points) || points.length < 2) {
    return { available: false, message: "Insufficient dated records are available to calculate a trend." };
  }

  const midpoint = Math.ceil(points.length / 2);
  const earlier = average(points.slice(0, midpoint).map((point) => point.value));
  const recent = average(points.slice(midpoint).map((point) => point.value));
  const changePct = earlier ? ((recent - earlier) / earlier) * 100 : 0;

  return {
    available: true,
    earlierAverage: round(earlier, 2),
    recentAverage: round(recent, 2),
    changePct: round(changePct, 1),
    direction: changePct > 1 ? "up" : changePct < -1 ? "down" : "stable",
    periods: points.length,
  };
};

export const calculateCorrelation = (pairs) => {
  const validPairs = (pairs || []).filter(
    (pair) => Number.isFinite(Number(pair?.x)) && Number.isFinite(Number(pair?.y))
  );
  if (validPairs.length < 3) return { available: false, message: "At least three comparable groups are required." };

  const xAverage = average(validPairs.map((pair) => Number(pair.x)));
  const yAverage = average(validPairs.map((pair) => Number(pair.y)));
  const numerator = sum(validPairs.map((pair) => (pair.x - xAverage) * (pair.y - yAverage)));
  const xDeviation = Math.sqrt(sum(validPairs.map((pair) => (pair.x - xAverage) ** 2)));
  const yDeviation = Math.sqrt(sum(validPairs.map((pair) => (pair.y - yAverage) ** 2)));
  const coefficient = xDeviation && yDeviation ? numerator / (xDeviation * yDeviation) : 0;

  return {
    available: Boolean(xDeviation && yDeviation),
    coefficient: round(coefficient, 2),
    strength: Math.abs(coefficient) >= 0.7 ? "strong" : Math.abs(coefficient) >= 0.4 ? "moderate" : "weak",
    observations: validPairs.length,
  };
};

export const detectAnomalies = (items, getValue, getLabel, limit = 3) => {
  const values = items.map(getValue).filter(Number.isFinite);
  if (values.length < 3) return [];
  const mean = average(values);
  const standardDeviation = Math.sqrt(average(values.map((value) => (value - mean) ** 2)));
  if (!standardDeviation) return [];

  return items
    .map((item) => ({ item, value: getValue(item), zScore: (getValue(item) - mean) / standardDeviation }))
    .filter(({ zScore }) => Math.abs(zScore) >= 1.5)
    .sort((left, right) => Math.abs(right.zScore) - Math.abs(left.zScore))
    .slice(0, limit)
    .map(({ item, value, zScore }) => ({ label: getLabel(item), value: round(value, 2), zScore: round(zScore, 2) }));
};

export async function getActiveDatasetContext(userId) {
  let meta = await DatasetMeta.findOne({ ownerUserId: userId, isActive: true })
    .sort({ uploadedAt: -1, createdAt: -1 })
    .lean();

  if (!meta) {
    const newestDataset = await DatasetMeta.findOne({ ownerUserId: userId })
      .sort({ uploadedAt: -1, createdAt: -1 })
      .lean();

    if (newestDataset?.datasetId) {
      await DatasetMeta.updateMany({ ownerUserId: userId, isActive: true }, { $set: { isActive: false } });
      await DatasetMeta.updateOne(
        { _id: newestDataset._id, ownerUserId: userId },
        { $set: { isActive: true } }
      );
      meta = { ...newestDataset, isActive: true };
    }
  }

  if (!meta?.datasetId) {
    return { hasDataset: false, dataset: null, employees: [], salesRecords: [], marketingRecords: [], financeRecords: [], operationsRecords: [] };
  }

  const [employees, businessDataset] = await Promise.all([
    Employee.find({ ownerUserId: userId, datasetId: meta.datasetId }).lean(),
    BusinessDataset.findOne({ ownerUserId: userId, datasetId: meta.datasetId }).lean(),
  ]);

  return {
    hasDataset: true,
    dataset: {
      id: meta.datasetId,
      fileName: meta.fileName,
      source: meta.source,
      recordCount: Number(meta.recordCount || 0),
      sheetCounts: meta.sheetCounts || {},
    },
    employees,
    salesRecords: businessDataset?.salesRecords || [],
    marketingRecords: businessDataset?.marketingRecords || [],
    financeRecords: businessDataset?.financeRecords || [],
    operationsRecords: businessDataset?.operationsRecords || [],
  };
}

export function getEmployeeStatistics(context) {
  const { employees } = context;
  if (!employees.length) return { available: false, message: "No HR employee records are available in the active dataset." };

  const departments = Object.entries(groupBy(employees, (employee) => employee.department))
    .map(([department, rows]) => ({
      department,
      employees: rows.length,
      performanceRating: round(average(rows.map((row) => row.performanceRating)), 2),
      satisfaction: round(average(rows.map((row) => row.jobSatisfaction)), 2),
      attritionRate: round(percent(rows.filter((row) => row.attrition).length, rows.length), 1),
      goalAchievementPct: round(average(rows.map((row) => row.goalAchievementPct)), 1),
      qualityScore: round(average(rows.map((row) => row.qualityScore)), 1),
    }))
    .sort((left, right) => left.performanceRating - right.performanceRating);

  const attritionRows = employees.filter((employee) => employee.attrition);
  const performanceTrend = calculateTrend(
    monthlyTotals(employees, "snapshotDate", "performanceRating").map((point) => ({ ...point, value: point.value }))
  );

  return {
    available: true,
    recordCount: employees.length,
    averagePerformanceRating: round(average(employees.map((employee) => employee.performanceRating)), 2),
    averageSatisfaction: round(average(employees.map((employee) => employee.jobSatisfaction)), 2),
    attritionRate: round(percent(attritionRows.length, employees.length), 1),
    averageWorkLifeBalance: round(average(employees.map((employee) => employee.workLifeBalance)), 2),
    departments,
    lowestPerformanceDepartment: departments[0] || null,
    highestPerformanceDepartment: departments.at(-1) || null,
    highestAttritionDepartment: [...departments].sort((left, right) => right.attritionRate - left.attritionRate)[0] || null,
    performanceTrend,
  };
}

export function getSalesSummary(context) {
  const { salesRecords } = context;
  if (!salesRecords.length) return { available: false, message: "No sales records are available in the active dataset." };

  const byDepartment = Object.entries(groupBy(salesRecords, (record) => record.department)).map(([department, rows]) => ({
    department,
    revenue: round(sum(rows.map((row) => row.revenue)), 2),
    target: round(sum(rows.map((row) => row.target)), 2),
    attainmentPct: round(percent(sum(rows.map((row) => row.revenue)), sum(rows.map((row) => row.target))), 1),
    orders: round(sum(rows.map((row) => row.orders))),
  }));
  const trend = calculateTrend(monthlyTotals(salesRecords, "salesDate", "revenue"));

  return {
    available: true,
    recordCount: salesRecords.length,
    totalRevenue: round(sum(salesRecords.map((record) => record.revenue)), 2),
    totalTarget: round(sum(salesRecords.map((record) => record.target)), 2),
    targetAttainmentPct: round(percent(sum(salesRecords.map((record) => record.revenue)), sum(salesRecords.map((record) => record.target))), 1),
    totalOrders: round(sum(salesRecords.map((record) => record.orders))),
    trend,
    byDepartment: byDepartment.sort((left, right) => right.revenue - left.revenue),
    topDepartment: [...byDepartment].sort((left, right) => right.revenue - left.revenue)[0] || null,
    bottomDepartment: [...byDepartment].sort((left, right) => left.revenue - right.revenue)[0] || null,
    revenueAnomalies: detectAnomalies(salesRecords, (record) => Number(record.revenue), (record) => `${toLabel(record.department)} sales record`),
  };
}

export function getFinanceSummary(context) {
  const { financeRecords } = context;
  if (!financeRecords.length) return { available: false, message: "No finance records are available in the active dataset." };
  const totalRevenue = sum(financeRecords.map((record) => record.revenue));
  const totalExpenses = sum(financeRecords.map((record) => record.expenses));
  const totalProfit = sum(financeRecords.map((record) => record.netProfit));
  const byDepartment = Object.entries(groupBy(financeRecords, (record) => record.department)).map(([department, rows]) => ({
    department,
    revenue: round(sum(rows.map((row) => row.revenue)), 2),
    expenses: round(sum(rows.map((row) => row.expenses)), 2),
    netProfit: round(sum(rows.map((row) => row.netProfit)), 2),
  }));

  return {
    available: true,
    recordCount: financeRecords.length,
    totalRevenue: round(totalRevenue, 2),
    totalExpenses: round(totalExpenses, 2),
    netProfit: round(totalProfit, 2),
    profitMarginPct: round(percent(totalProfit, totalRevenue), 1),
    trend: calculateTrend(monthlyTotals(financeRecords, "financeDate", "netProfit")),
    byDepartment: byDepartment.sort((left, right) => left.netProfit - right.netProfit),
    lowestProfitDepartment: [...byDepartment].sort((left, right) => left.netProfit - right.netProfit)[0] || null,
  };
}

export function getMarketingSummary(context) {
  const { marketingRecords } = context;
  if (!marketingRecords.length) return { available: false, message: "No marketing records are available in the active dataset." };

  const byChannel = Object.entries(groupBy(marketingRecords, (record) => record.channel)).map(([channel, rows]) => {
    const spend = sum(rows.map((row) => row.spend));
    const revenue = sum(rows.map((row) => row.revenue));
    return { channel, spend: round(spend, 2), revenue: round(revenue, 2), roiPct: round(percent(revenue - spend, spend), 1), conversions: round(sum(rows.map((row) => row.conversions))) };
  });

  return {
    available: true,
    recordCount: marketingRecords.length,
    spend: round(sum(marketingRecords.map((record) => record.spend)), 2),
    revenue: round(sum(marketingRecords.map((record) => record.revenue)), 2),
    conversions: round(sum(marketingRecords.map((record) => record.conversions))),
    byChannel: byChannel.sort((left, right) => right.roiPct - left.roiPct),
    topChannel: [...byChannel].sort((left, right) => right.roiPct - left.roiPct)[0] || null,
    bottomChannel: [...byChannel].sort((left, right) => left.roiPct - right.roiPct)[0] || null,
  };
}

export function getOperationsSummary(context) {
  const { operationsRecords } = context;
  if (!operationsRecords.length) return { available: false, message: "No operations records are available in the active dataset." };

  const byDepartment = Object.entries(groupBy(operationsRecords, (record) => record.department)).map(([department, rows]) => ({
    department,
    utilizationPct: round(average(rows.map((row) => row.utilizationPct)), 1),
    defectRatePct: round(average(rows.map((row) => row.defectRatePct)), 1),
    onTimeDeliveryPct: round(average(rows.map((row) => row.onTimeDeliveryPct)), 1),
    downtimeMinutes: round(sum(rows.map((row) => row.downtimeMinutes))),
  }));

  return {
    available: true,
    recordCount: operationsRecords.length,
    utilizationPct: round(average(operationsRecords.map((record) => record.utilizationPct)), 1),
    defectRatePct: round(average(operationsRecords.map((record) => record.defectRatePct)), 1),
    onTimeDeliveryPct: round(average(operationsRecords.map((record) => record.onTimeDeliveryPct)), 1),
    byDepartment: byDepartment.sort((left, right) => right.defectRatePct - left.defectRatePct),
    highestDefectDepartment: [...byDepartment].sort((left, right) => right.defectRatePct - left.defectRatePct)[0] || null,
  };
}

export function compareEmployeeAndSales(context, employeeStats, salesSummary) {
  if (!employeeStats?.available || !salesSummary?.available) {
    return { available: false, message: "Both HR and sales records are required for this comparison." };
  }
  const salesByDepartment = new Map((salesSummary.byDepartment || []).map((item) => [item.department, item]));
  const pairs = (employeeStats.departments || [])
    .filter((department) => salesByDepartment.has(department.department))
    .map((department) => ({ x: department.performanceRating, y: salesByDepartment.get(department.department).revenue, department: department.department }));

  return { available: true, correlation: calculateCorrelation(pairs), comparedDepartments: pairs.length };
}

export function analyzeHrQuestion(context, message = "") {
  const stats = getEmployeeStatistics(context);
  if (!stats.available) {
    return { agent: "HR Agent", available: false, canAnswer: false, unsupportedReason: stats.message, findings: [stats.message], metrics: {} };
  }

  const msg = message.toLowerCase();
  const employees = context.employees || [];

  if (/\b(customer satisfaction|nps|shirt size|commute time|marital status|credit score)\b/i.test(msg)) {
    const match = msg.match(/\b(customer satisfaction|nps|shirt size|commute time|marital status|credit score)\b/i)[0];
    return {
      agent: "HR Agent",
      available: true,
      canAnswer: false,
      unsupportedReason: `The active dataset does not contain "${match}" data in employee records.`,
      findings: [`I can't determine "${match}" from the active dataset because it does not contain a "${match}" field for HR records.`],
      metrics: { recordCount: stats.recordCount },
    };
  }

  if (/\b(attrition|turnover|leaving|left|resign|retention)\b/i.test(msg)) {
    const highestAttr = stats.highestAttritionDepartment;
    const deptList = (stats.departments || [])
      .sort((a, b) => b.attritionRate - a.attritionRate)
      .map((d) => `${d.department}: ${d.attritionRate}% (${Math.round((d.attritionRate / 100) * d.employees)}/${d.employees} employees)`);

    const findings = [
      `Overall company-wide attrition rate is ${stats.attritionRate}% across ${stats.recordCount} total employees.`,
    ];
    if (highestAttr) {
      findings.push(`${highestAttr.department} department has the highest attrition rate at ${highestAttr.attritionRate}%.`);
    }
    findings.push(`Attrition rate breakdown by department:\n${deptList.map((item) => `- ${item}`).join("\n")}`);

    return {
      agent: "HR Agent",
      available: true,
      canAnswer: true,
      intent: "hr_attrition",
      metrics: {
        totalEmployees: stats.recordCount,
        companyAttritionRate: stats.attritionRate,
        highestAttritionDepartment: highestAttr,
        departments: stats.departments,
      },
      findings,
    };
  }

  if (/\b(satisfaction|happy|morale|work-life|work life|balance)\b/i.test(msg)) {
    const deptsBySat = [...(stats.departments || [])].sort((a, b) => b.satisfaction - a.satisfaction);
    const topSat = deptsBySat[0];
    const botSat = deptsBySat.at(-1);

    const findings = [
      `Average employee job satisfaction across the company is ${stats.averageSatisfaction} out of 5.`,
      `Average work-life balance rating is ${stats.averageWorkLifeBalance} out of 5.`,
    ];
    if (topSat) findings.push(`${topSat.department} department has the highest average job satisfaction (${topSat.satisfaction}/5).`);
    if (botSat && botSat.department !== topSat?.department) {
      findings.push(`${botSat.department} department has the lowest average job satisfaction (${botSat.satisfaction}/5).`);
    }

    return {
      agent: "HR Agent",
      available: true,
      canAnswer: true,
      intent: "hr_satisfaction",
      metrics: {
        averageSatisfaction: stats.averageSatisfaction,
        averageWorkLifeBalance: stats.averageWorkLifeBalance,
        topSatisfactionDepartment: topSat,
        lowestSatisfactionDepartment: botSat,
      },
      findings,
    };
  }

  if (/\b(performance|rating|evaluation|score|trend|declined|improved)\b/i.test(msg)) {
    const lowestPerf = stats.lowestPerformanceDepartment;
    const highestPerf = stats.highestPerformanceDepartment;
    const findings = [
      `Average employee performance rating across all ${stats.recordCount} employees is ${stats.averagePerformanceRating} out of 5.`,
    ];
    if (lowestPerf) findings.push(`${lowestPerf.department} department has the lowest average performance rating (${lowestPerf.performanceRating}/5).`);
    if (highestPerf && highestPerf.department !== lowestPerf?.department) {
      findings.push(`${highestPerf.department} department has the highest average performance rating (${highestPerf.performanceRating}/5).`);
    }
    if (stats.performanceTrend?.available) {
      findings.push(`Employee performance trend is ${stats.performanceTrend.direction} by ${Math.abs(stats.performanceTrend.changePct)}% across recent tracking periods.`);
    }

    return {
      agent: "HR Agent",
      available: true,
      canAnswer: true,
      intent: "hr_performance",
      metrics: {
        averagePerformanceRating: stats.averagePerformanceRating,
        lowestPerformanceDepartment: lowestPerf,
        highestPerformanceDepartment: highestPerf,
        performanceTrend: stats.performanceTrend,
      },
      findings,
    };
  }

  if (/\b(salary|income|compensation|pay|monthly income|payroll)\b/i.test(msg)) {
    const totalIncome = sum(employees.map((e) => e.monthlyIncome));
    const avgIncome = round(average(employees.map((e) => e.monthlyIncome)), 2);

    const deptIncome = Object.entries(groupBy(employees, (e) => e.department)).map(([dept, rows]) => ({
      department: dept,
      averageMonthlyIncome: round(average(rows.map((r) => r.monthlyIncome)), 2),
    })).sort((a, b) => b.averageMonthlyIncome - a.averageMonthlyIncome);

    const findings = [
      `Average monthly income across employees is $${formatCurrency(avgIncome)}.`,
      `Total monthly payroll expense across ${employees.length} employees is $${formatCurrency(round(totalIncome, 2))}.`,
    ];
    if (deptIncome.length) {
      findings.push(`Highest paying department on average: ${deptIncome[0].department} ($${formatCurrency(deptIncome[0].averageMonthlyIncome)}/month).`);
    }

    return {
      agent: "HR Agent",
      available: true,
      canAnswer: true,
      intent: "hr_compensation",
      metrics: { averageMonthlyIncome: avgIncome, totalMonthlyPayroll: totalIncome, departmentIncome: deptIncome },
      findings,
    };
  }

  const defaultFindings = [
    `The active dataset contains ${stats.recordCount} employee records.`,
    `Average employee performance rating is ${stats.averagePerformanceRating}/5 and average job satisfaction is ${stats.averageSatisfaction}/5.`,
    `Overall attrition rate is ${stats.attritionRate}%.`,
  ];
  if (stats.lowestPerformanceDepartment) defaultFindings.push(`${stats.lowestPerformanceDepartment.department} department has the lowest average performance rating (${stats.lowestPerformanceDepartment.performanceRating}).`);
  if (stats.highestAttritionDepartment) defaultFindings.push(`${stats.highestAttritionDepartment.department} department has the highest attrition rate (${stats.highestAttritionDepartment.attritionRate}%).`);

  return {
    agent: "HR Agent",
    available: true,
    canAnswer: true,
    intent: "hr_general",
    metrics: stats,
    findings: defaultFindings,
  };
}

export function analyzeSalesQuestion(context, message = "") {
  const summary = getSalesSummary(context);
  if (!summary.available) {
    return { agent: "Sales Agent", available: false, canAnswer: false, unsupportedReason: summary.message, findings: [summary.message], metrics: {} };
  }

  const msg = message.toLowerCase();
  const sales = context.salesRecords || [];

  if (/\b(customer lifetime value|clv|ltv|churn rate|nps|net promoter score|customer satisfaction)\b/i.test(msg)) {
    const match = msg.match(/\b(customer lifetime value|clv|ltv|churn rate|nps|net promoter score|customer satisfaction)\b/i)[0];
    return {
      agent: "Sales Agent",
      available: true,
      canAnswer: false,
      unsupportedReason: `The active dataset does not contain "${match}" data in sales records.`,
      findings: [`I can't determine "${match}" from the active dataset because it does not contain a "${match}" field in the sales records.`],
      metrics: { recordCount: summary.recordCount },
    };
  }

  if (/\b(region|regional|geography|location|territory|zone|south|north|east|west)\b/i.test(msg)) {
    const hasRegionData = sales.some((r) => Boolean(String(r.region || "").trim()));
    if (!hasRegionData) {
      return {
        agent: "Sales Agent",
        available: true,
        canAnswer: false,
        unsupportedReason: "The active dataset does not contain populated region data in sales records.",
        findings: [
          "The active dataset does not contain regional sales breakdown data (the 'region' field is not populated).",
          `However, total sales revenue across all departments is $${formatCurrency(summary.totalRevenue)} with ${summary.targetAttainmentPct}% target attainment.`,
        ],
        metrics: { totalRevenue: summary.totalRevenue, byDepartment: summary.byDepartment },
      };
    }

    const byRegion = Object.entries(groupBy(sales, (r) => r.region)).map(([region, rows]) => ({
      region,
      revenue: round(sum(rows.map((r) => r.revenue)), 2),
      orders: round(sum(rows.map((r) => r.orders))),
    })).sort((a, b) => b.revenue - a.revenue);

    const topRegion = byRegion[0];
    const pct = summary.totalRevenue ? round((topRegion.revenue / summary.totalRevenue) * 100, 1) : 0;
    const findings = [
      `${topRegion.region} region generated the highest sales revenue at $${formatCurrency(topRegion.revenue)} (${pct}% of total sales revenue).`,
      `Regional sales breakdown:\n${byRegion.map((r) => `- ${r.region}: $${formatCurrency(r.revenue)} (${r.orders} orders)`).join("\n")}`,
    ];

    return {
      agent: "Sales Agent",
      available: true,
      canAnswer: true,
      intent: "sales_region",
      metrics: { topRegion, byRegion, totalRevenue: summary.totalRevenue },
      findings,
    };
  }

  if (/\b(product|products|category|categories|item|items)\b/i.test(msg)) {
    const hasProductData = sales.some((r) => Boolean(String(r.productCategory || "").trim()));
    if (!hasProductData) {
      return {
        agent: "Sales Agent",
        available: true,
        canAnswer: false,
        unsupportedReason: "The active dataset does not contain populated product category data.",
        findings: [
          "The active dataset does not contain product category breakdown data (the 'productCategory' field is empty).",
          `Total sales revenue across departments is $${formatCurrency(summary.totalRevenue)}.`,
        ],
        metrics: { totalRevenue: summary.totalRevenue },
      };
    }

    const byCategory = Object.entries(groupBy(sales, (r) => r.productCategory)).map(([category, rows]) => ({
      category,
      revenue: round(sum(rows.map((r) => r.revenue)), 2),
      unitsSold: round(sum(rows.map((r) => r.unitsSold))),
    })).sort((a, b) => b.revenue - a.revenue);

    const topCategory = byCategory[0];
    const findings = [
      `Top performing product category is ${topCategory.category} with $${formatCurrency(topCategory.revenue)} in revenue (${topCategory.unitsSold} units sold).`,
      `Product category breakdown:\n${byCategory.map((c) => `- ${c.category}: $${formatCurrency(c.revenue)} (${c.unitsSold} units)`).join("\n")}`,
    ];

    return {
      agent: "Sales Agent",
      available: true,
      canAnswer: true,
      intent: "sales_product",
      metrics: { topCategory, byCategory },
      findings,
    };
  }

  if (/\b(revenue|sales|target|attainment|department|top|highest|best|compare)\b/i.test(msg)) {
    const topDept = summary.topDepartment;
    const botDept = summary.bottomDepartment;
    const findings = [
      `Total sales revenue across all ${summary.recordCount} sales records is $${formatCurrency(summary.totalRevenue)} against a target of $${formatCurrency(summary.totalTarget)} (${summary.targetAttainmentPct}% target attainment).`,
    ];
    if (topDept) {
      findings.push(`${topDept.department} department generated the highest sales revenue ($${formatCurrency(topDept.revenue)}, ${topDept.attainmentPct}% target attainment).`);
    }
    if (botDept && botDept.department !== topDept?.department) {
      findings.push(`${botDept.department} department generated the lowest sales revenue ($${formatCurrency(botDept.revenue)}, ${botDept.attainmentPct}% target attainment).`);
    }
    if (summary.trend?.available) {
      findings.push(`Sales revenue trend is ${summary.trend.direction} by ${Math.abs(summary.trend.changePct)}% compared to earlier available periods.`);
    }

    return {
      agent: "Sales Agent",
      available: true,
      canAnswer: true,
      intent: "sales_revenue",
      metrics: { totalRevenue: summary.totalRevenue, totalTarget: summary.totalTarget, targetAttainmentPct: summary.targetAttainmentPct, topDepartment: topDept, bottomDepartment: botDept },
      findings,
    };
  }

  const defaultFindings = [
    `Total sales revenue is $${formatCurrency(summary.totalRevenue)} across ${summary.recordCount} records, with ${summary.targetAttainmentPct}% target attainment.`,
  ];
  if (summary.topDepartment) defaultFindings.push(`${summary.topDepartment.department} department generated the highest sales revenue ($${formatCurrency(summary.topDepartment.revenue)}).`);
  if (summary.trend?.available) defaultFindings.push(`Revenue trend is ${summary.trend.direction} by ${Math.abs(summary.trend.changePct)}%.`);

  return {
    agent: "Sales Agent",
    available: true,
    canAnswer: true,
    intent: "sales_general",
    metrics: summary,
    findings: defaultFindings,
  };
}

export function analyzeFinanceQuestion(context, message = "") {
  const summary = getFinanceSummary(context);
  if (!summary.available) {
    return { agent: "Finance Agent", available: false, canAnswer: false, unsupportedReason: summary.message, findings: [summary.message], metrics: {} };
  }

  const msg = message.toLowerCase();

  if (/\b(stock price|market cap|valuation|crypto|dividend|share price)\b/i.test(msg)) {
    const match = msg.match(/\b(stock price|market cap|valuation|crypto|dividend|share price)\b/i)[0];
    return {
      agent: "Finance Agent",
      available: true,
      canAnswer: false,
      unsupportedReason: `The active dataset does not contain "${match}" data in finance records.`,
      findings: [`I can't determine "${match}" from the active dataset because it does not contain a "${match}" field for financial records.`],
      metrics: { recordCount: summary.recordCount },
    };
  }

  if (/\b(expense|expenses|cost|costs|spending|spent)\b/i.test(msg)) {
    const deptsByExpense = [...(summary.byDepartment || [])].sort((a, b) => b.expenses - a.expenses);
    const highestExpenseDept = deptsByExpense[0];

    const findings = [
      `Total financial expenses across all departments equal $${formatCurrency(summary.totalExpenses)}.`,
    ];
    if (highestExpenseDept) {
      findings.push(`${highestExpenseDept.department} department incurred the highest total expenses at $${formatCurrency(highestExpenseDept.expenses)} (Revenue: $${formatCurrency(highestExpenseDept.revenue)}, Net Profit: $${formatCurrency(highestExpenseDept.netProfit)}).`);
    }
    findings.push(`Expenses breakdown by department:\n${deptsByExpense.map((d) => `- ${d.department}: $${formatCurrency(d.expenses)} in expenses`).join("\n")}`);

    return {
      agent: "Finance Agent",
      available: true,
      canAnswer: true,
      intent: "finance_expenses",
      metrics: { totalExpenses: summary.totalExpenses, highestExpenseDepartment: highestExpenseDept, byDepartment: summary.byDepartment },
      findings,
    };
  }

  if (/\b(profit|profitability|margin|net profit|bottom line)\b/i.test(msg)) {
    const lowestProfitDept = summary.lowestProfitDepartment;
    const deptsByProfit = [...(summary.byDepartment || [])].sort((a, b) => b.netProfit - a.netProfit);
    const highestProfitDept = deptsByProfit[0];

    const findings = [
      `Total net profit is $${formatCurrency(summary.netProfit)} on total revenue of $${formatCurrency(summary.totalRevenue)} (${summary.profitMarginPct}% profit margin).`,
    ];
    if (highestProfitDept) findings.push(`${highestProfitDept.department} department generated the highest net profit ($${formatCurrency(highestProfitDept.netProfit)}).`);
    if (lowestProfitDept && lowestProfitDept.department !== highestProfitDept?.department) {
      findings.push(`${lowestProfitDept.department} department generated the lowest net profit ($${formatCurrency(lowestProfitDept.netProfit)}).`);
    }
    if (summary.trend?.available) {
      findings.push(`Net profit trend is ${summary.trend.direction} by ${Math.abs(summary.trend.changePct)}% across available financial periods.`);
    }

    return {
      agent: "Finance Agent",
      available: true,
      canAnswer: true,
      intent: "finance_profit",
      metrics: { totalRevenue: summary.totalRevenue, totalExpenses: summary.totalExpenses, netProfit: summary.netProfit, profitMarginPct: summary.profitMarginPct, lowestProfitDepartment: lowestProfitDept },
      findings,
    };
  }

  const defaultFindings = [
    `Finance records show total revenue of $${formatCurrency(summary.totalRevenue)}, total expenses of $${formatCurrency(summary.totalExpenses)}, and net profit of $${formatCurrency(summary.netProfit)} (${summary.profitMarginPct}% margin).`,
  ];
  if (summary.lowestProfitDepartment) defaultFindings.push(`${summary.lowestProfitDepartment.department} department has the lowest net profit ($${formatCurrency(summary.lowestProfitDepartment.netProfit)}).`);

  return {
    agent: "Finance Agent",
    available: true,
    canAnswer: true,
    intent: "finance_general",
    metrics: summary,
    findings: defaultFindings,
  };
}

export function analyzeMarketingQuestion(context, message = "") {
  const summary = getMarketingSummary(context);
  if (!summary.available) {
    return { agent: "Marketing Agent", available: false, canAnswer: false, unsupportedReason: summary.message, findings: [summary.message], metrics: {} };
  }

  const msg = message.toLowerCase();

  if (/\b(brand awareness|social mentions|influencer score|sentiment score)\b/i.test(msg)) {
    const match = msg.match(/\b(brand awareness|social mentions|influencer score|sentiment score)\b/i)[0];
    return {
      agent: "Marketing Agent",
      available: true,
      canAnswer: false,
      unsupportedReason: `The active dataset does not contain "${match}" data in marketing records.`,
      findings: [`I can't determine "${match}" from the active dataset because it does not contain a "${match}" field in marketing records.`],
      metrics: { recordCount: summary.recordCount },
    };
  }

  if (/\b(campaign|campaigns|promo|promotions)\b/i.test(msg)) {
    const records = context.marketingRecords || [];
    const hasCampaign = records.some((r) => Boolean(String(r.campaign || "").trim()));
    if (!hasCampaign) {
      return {
        agent: "Marketing Agent",
        available: true,
        canAnswer: false,
        unsupportedReason: "The active dataset does not contain campaign names.",
        findings: ["The active dataset does not contain specific campaign name data."],
        metrics: { spend: summary.spend, revenue: summary.revenue },
      };
    }

    const byCampaign = Object.entries(groupBy(records, (r) => r.campaign)).map(([campaign, rows]) => {
      const spend = sum(rows.map((r) => r.spend));
      const revenue = sum(rows.map((r) => r.revenue));
      const conversions = sum(rows.map((r) => r.conversions));
      const roiPct = spend ? round(((revenue - spend) / spend) * 100, 1) : 0;
      return { campaign, spend: round(spend, 2), revenue: round(revenue, 2), conversions: round(conversions), roiPct };
    }).sort((a, b) => b.roiPct - a.roiPct);

    const topCampaign = byCampaign[0];
    const botCampaign = byCampaign.at(-1);

    const findings = [
      `Top performing marketing campaign is "${topCampaign.campaign}" with an ROI of ${topCampaign.roiPct}% (Attributed Revenue: $${formatCurrency(topCampaign.revenue)}, Spend: $${formatCurrency(topCampaign.spend)}, Conversions: ${topCampaign.conversions}).`,
    ];
    if (botCampaign && botCampaign.campaign !== topCampaign.campaign) {
      findings.push(`Lowest performing campaign is "${botCampaign.campaign}" with an ROI of ${botCampaign.roiPct}%.`);
    }
    findings.push(`Campaign performance breakdown:\n${byCampaign.map((c) => `- ${c.campaign}: ${c.roiPct}% ROI ($${formatCurrency(c.revenue)} revenue from $${formatCurrency(c.spend)} spend)`).join("\n")}`);

    return {
      agent: "Marketing Agent",
      available: true,
      canAnswer: true,
      intent: "marketing_campaign",
      metrics: { topCampaign, bottomCampaign: botCampaign, byCampaign },
      findings,
    };
  }

  if (/\b(channel|channels|lead|leads|channel ROI|source)\b/i.test(msg)) {
    const topChannel = summary.topChannel;
    const botChannel = summary.bottomChannel;
    const findings = [
      `Total marketing spend is $${formatCurrency(summary.spend)} generating $${formatCurrency(summary.revenue)} attributed revenue and ${summary.conversions} conversions.`,
    ];
    if (topChannel) {
      findings.push(`${topChannel.channel} is the best performing marketing channel with ${topChannel.roiPct}% ROI ($${formatCurrency(topChannel.revenue)} revenue on $${formatCurrency(topChannel.spend)} spend).`);
    }
    if (botChannel && botChannel.channel !== topChannel?.channel) {
      findings.push(`${botChannel.channel} is the lowest performing channel with ${botChannel.roiPct}% ROI.`);
    }

    return {
      agent: "Marketing Agent",
      available: true,
      canAnswer: true,
      intent: "marketing_channel",
      metrics: { topChannel, bottomChannel: botChannel, byChannel: summary.byChannel },
      findings,
    };
  }

  if (/\b(conversion|conversions|conversion rate|spend|clicks|impressions)\b/i.test(msg)) {
    const findings = [
      `Marketing campaigns drove a total of ${summary.conversions} conversions from a total spend of $${formatCurrency(summary.spend)}.`,
      `Total attributed revenue from marketing is $${formatCurrency(summary.revenue)}.`,
    ];
    if (summary.topChannel) findings.push(`Top channel by ROI is ${summary.topChannel.channel} (${summary.topChannel.roiPct}% ROI).`);

    return {
      agent: "Marketing Agent",
      available: true,
      canAnswer: true,
      intent: "marketing_conversion",
      metrics: summary,
      findings,
    };
  }

  const defaultFindings = [
    `Marketing records show $${formatCurrency(summary.spend)} total spend, $${formatCurrency(summary.revenue)} attributed revenue, and ${summary.conversions} total conversions.`,
  ];
  if (summary.topChannel) defaultFindings.push(`${summary.topChannel.channel} has the highest measured ROI (${summary.topChannel.roiPct}%).`);

  return {
    agent: "Marketing Agent",
    available: true,
    canAnswer: true,
    intent: "marketing_general",
    metrics: summary,
    findings: defaultFindings,
  };
}

export function analyzeOperationsQuestion(context, message = "") {
  const summary = getOperationsSummary(context);
  if (!summary.available) {
    return { agent: "Operations Agent", available: false, canAnswer: false, unsupportedReason: summary.message, findings: [summary.message], metrics: {} };
  }

  const msg = message.toLowerCase();

  if (/\b(vendor rating|shipping supplier name|carbon footprint|warehouse temperature)\b/i.test(msg)) {
    const match = msg.match(/\b(vendor rating|shipping supplier name|carbon footprint|warehouse temperature)\b/i)[0];
    return {
      agent: "Operations Agent",
      available: true,
      canAnswer: false,
      unsupportedReason: `The active dataset does not contain "${match}" data in operations records.`,
      findings: [`I can't determine "${match}" from the active dataset because it does not contain a "${match}" field in operations records.`],
      metrics: { recordCount: summary.recordCount },
    };
  }

  if (/\b(bottleneck|bottlenecks|efficiency|efficient|lowest|defect|defects|defect rate|utilization|downtime|delivery|cycle time)\b/i.test(msg)) {
    const highestDefectDept = summary.highestDefectDepartment;
    const deptsByUtil = [...(summary.byDepartment || [])].sort((a, b) => a.utilizationPct - b.utilizationPct);
    const lowestUtilDept = deptsByUtil[0];

    const findings = [
      `Average operational metrics across the organization: ${summary.utilizationPct}% utilization, ${summary.defectRatePct}% defect rate, and ${summary.onTimeDeliveryPct}% on-time delivery.`,
    ];
    if (highestDefectDept) {
      findings.push(`${highestDefectDept.department} has the highest average defect rate at ${highestDefectDept.defectRatePct}% (with ${highestDefectDept.downtimeMinutes} total downtime minutes).`);
    }
    if (lowestUtilDept && lowestUtilDept.department !== highestDefectDept?.department) {
      findings.push(`${lowestUtilDept.department} has the lowest average capacity utilization at ${lowestUtilDept.utilizationPct}%.`);
    }

    return {
      agent: "Operations Agent",
      available: true,
      canAnswer: true,
      intent: "operations_efficiency",
      metrics: {
        utilizationPct: summary.utilizationPct,
        defectRatePct: summary.defectRatePct,
        onTimeDeliveryPct: summary.onTimeDeliveryPct,
        highestDefectDepartment: highestDefectDept,
        lowestUtilizationDepartment: lowestUtilDept,
      },
      findings,
    };
  }

  const defaultFindings = [
    `Operations records average ${summary.utilizationPct}% capacity utilization, ${summary.defectRatePct}% defect rate, and ${summary.onTimeDeliveryPct}% on-time delivery.`,
  ];
  if (summary.highestDefectDepartment) defaultFindings.push(`${summary.highestDefectDepartment.department} has the highest average defect rate (${summary.highestDefectDepartment.defectRatePct}%).`);

  return {
    agent: "Operations Agent",
    available: true,
    canAnswer: true,
    intent: "operations_general",
    metrics: summary,
    findings: defaultFindings,
  };
}

