const asList = (items) => items.map((item) => `- ${item}`).join("\n");
const toNumber = (value) => Number(value ?? 0);
const employeeRankingScore = (employee) =>
  toNumber(employee.performanceRating) * 0.5 +
  toNumber(employee.jobSatisfaction) * 0.3 +
  toNumber(employee.workLifeBalance) * 0.2;

const classifyQuestionType = (message = "", findings = []) => {
  const q = String(message || "").toLowerCase();

  if (/(executive summary|organization summary|business overview|overall company performance|management overview|summary of my organization)/i.test(q)) return "EXECUTIVE_SUMMARY";
  if (/(best employee|top performing employee|highest performing employee|who is the best employee|top performer)/i.test(q)) return "RANKING";
  if (/(compare.*(sales|employee).*performance|sales.*vs.*employee|employee.*vs.*sales|compare sales and employee performance|vs\s+employee|versus\s+employee)/i.test(q)) return "COMPARISON";
  if (/(why.*(performance|changing|declining|improved|shifted)|trend|over time|why is.*performing)/i.test(q)) return "WHY_ANALYSIS";
  if (/(biggest business risks|key risks|risk assessment|business risks|risk)/i.test(q)) return "RISK_ANALYSIS";
  if (/(what is the total revenue|what are the total expenses|what is the average employee performance|how many employees|what is the average|how many .* employees|what is the .* revenue|what are the .* expenses)/i.test(q)) return "DIRECT_LOOKUP";
  if (/(which department has the highest|highest attrition|lowest efficiency|which .* department|department.*highest)/i.test(q)) return "DEPARTMENT_ANALYSIS";
  if (/(which campaign performed best|best campaign|campaign.*best|which campaign)/i.test(q)) return "MARKETING_ANALYSIS";
  if (/(what is the total revenue|average employee performance|total expenses|highest sales|target attainment|sales and employee performance)/i.test(q)) return "DIRECT_LOOKUP";
  if (findings.some((f) => f?.agent === "HR Agent") && /employee|performance|satisfaction|attrition/i.test(q)) return "EMPLOYEE_ANALYSIS";
  if (findings.some((f) => f?.agent === "Sales Agent") && /sales|revenue|region|product/i.test(q)) return "SALES_ANALYSIS";
  if (findings.some((f) => f?.agent === "Finance Agent") && /expense|profit|margin|budget|financial/i.test(q)) return "FINANCE_ANALYSIS";
  if (findings.some((f) => f?.agent === "Marketing Agent") && /campaign|marketing|roi|conversion|channel/i.test(q)) return "MARKETING_ANALYSIS";
  if (findings.some((f) => f?.agent === "Operations Agent") && /operations|efficiency|defect|utilization|bottleneck|delivery/i.test(q)) return "OPERATIONS_ANALYSIS";
  return "GENERAL_ANALYSIS";
};

const getEmployeeMetrics = (context = {}) => {
  const employees = Array.isArray(context.employees) ? context.employees : [];
  if (!employees.length) return { totalEmployees: 0, averagePerformance: 0, bestEmployee: null };

  const values = employees.map((employee) => toNumber(employee.performanceRating));
  const rankingScores = employees.map(employeeRankingScore);
  const maxRankingScore = Math.max(...rankingScores);
  const bestMatches = employees.filter((employee) => employeeRankingScore(employee) === maxRankingScore);

  return {
    totalEmployees: employees.length,
    averagePerformance: values.reduce((sum, value) => sum + value, 0) / values.length,
    bestEmployee: bestMatches.map((employee) => ({
      employeeId: employee.employeeId || "Unknown",
      name: employee.employeeName || employee.employeeId || "Employee",
      department: employee.department || "Unknown",
      performanceRating: toNumber(employee.performanceRating),
      jobSatisfaction: toNumber(employee.jobSatisfaction),
      workLifeBalance: toNumber(employee.workLifeBalance),
      rankingScore: employeeRankingScore(employee),
    })),
  };
};

const asCurrency = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value || 0));

const makeDirectLookupAnswer = (message, findings = [], context = {}) => {
  const q = String(message || "").toLowerCase();
  const hr = findings.find((f) => f?.agent === "HR Agent")?.data || {};
  const sales = findings.find((f) => f?.agent === "Sales Agent")?.data || {};
  const finance = findings.find((f) => f?.agent === "Finance Agent")?.data || {};
  const marketing = findings.find((f) => f?.agent === "Marketing Agent")?.data || {};

  if (/average employee performance|employee performance/i.test(q)) {
    const avg = hr.averagePerformanceRating ?? getEmployeeMetrics(context).averagePerformance;
    return {
      answer: `### Employee Performance\n\n**Average performance rating:** ${Number(avg || 0).toFixed(2)} / 5\n\nThis is the organization-wide average across the active employee records.`,
      insights: [`Average employee performance is ${Number(avg || 0).toFixed(2)} / 5.`],
      recommendations: [],
    };
  }

  if (/how many employees|employee count|number of employees/i.test(q)) {
    const count = hr.totalEmployees ?? hr.recordCount ?? getEmployeeMetrics(context).totalEmployees;
    return {
      answer: `### Employee Count\n\n**${count} employees**\n\nThe active dataset contains ${count} employee records.`,
      insights: [`The dataset contains ${count} employee records.`],
      recommendations: [],
    };
  }

  if (/total revenue|revenue/i.test(q)) {
    const total = sales.totalRevenue ?? finance.totalRevenue ?? 0;
    return {
      answer: `### Total Revenue\n\n**${asCurrency(total)}**\n\nThis is the total revenue recorded in the active dataset.`,
      insights: [`Total revenue is ${asCurrency(total)}.`],
      recommendations: [],
    };
  }

  if (/total expenses|expenses/i.test(q)) {
    const total = finance.totalExpenses ?? 0;
    return {
      answer: `### Total Expenses\n\n**${asCurrency(total)}**\n\nThis is the total expense amount recorded in the active finance dataset.`,
      insights: [`Total expenses are ${asCurrency(total)}.`],
      recommendations: [],
    };
  }

  if (/average satisfaction/i.test(q)) {
    const avg = hr.averageSatisfaction ?? 0;
    return {
      answer: `### Employee Satisfaction\n\n**Average satisfaction:** ${Number(avg).toFixed(2)} / 5\n\nThis is the current average satisfaction score across the employee records in the active dataset.`,
      insights: [`Average employee satisfaction is ${Number(avg).toFixed(2)} / 5.`],
      recommendations: [],
    };
  }

  if (/which campaign performed best|best campaign|campaign/i.test(q)) {
    const topCampaign = marketing.topCampaign || marketing.metrics?.topCampaign || null;
    if (topCampaign) {
      return {
        answer: `### Best Campaign\n\n**Campaign:** ${topCampaign.campaign}\n**ROI:** ${topCampaign.roiPct}%\n**Revenue:** ${asCurrency(topCampaign.revenue)}\n\nThis campaign had the highest verified ROI in the active marketing dataset.`,
        insights: [`The best campaign is ${topCampaign.campaign}.`],
        recommendations: [],
      };
    }
  }

  return {
    answer: `### Data Answer\n\nI found the relevant dataset-backed metrics and summarized them for this question.`,
    insights: ["The active dataset contains the requested metric."],
    recommendations: [],
  };
};

const makeRankingAnswer = (context = {}, findings = []) => {
  const employeeMetrics = getEmployeeMetrics(context);
  if (!employeeMetrics.bestEmployee?.length) {
    return {
      answer: `### Top Performing Employee\n\nThe current dataset does not contain enough employee performance information to identify a top performer.`,
      insights: ["No reliable employee performance ranking is available in the active dataset."],
      recommendations: [],
    };
  }

  const best = employeeMetrics.bestEmployee[0];
  const tieCount = employeeMetrics.bestEmployee.length;
  const line = tieCount > 1 ? `There is a tie at the top with ${tieCount} employees.` : `The highest composite employee ranking belongs to ${best.name}.`;

  return {
    answer: `### Top Performing Employee\n\n**Employee ID:** ${best.employeeId}\n**Employee:** ${best.name}\n**Ranking Score:** ${best.rankingScore.toFixed(2)}/5\n**Performance Rating:** ${best.performanceRating.toFixed(1)}/5\n**Department:** ${best.department}\n**Job Satisfaction:** ${best.jobSatisfaction.toFixed(1)}/5\n\n${line}\n\nBased on the available employee performance, satisfaction, and work-life balance data, this employee has the highest verified ranking score in the active dataset.`,
    insights: [`Top-performing employee is ${best.name} (employee ID: ${best.employeeId}) with a ${best.rankingScore.toFixed(2)}/5 composite ranking score.`],
    recommendations: [],
  };
};

const makeComparisonAnswer = (message, findings = [], context = {}) => {
  const hr = findings.find((f) => f?.agent === "HR Agent")?.data || {};
  const sales = findings.find((f) => f?.agent === "Sales Agent")?.data || {};
  const employeeAverage = hr.averagePerformanceRating ?? getEmployeeMetrics(context).averagePerformance;
  const totalRevenue = sales.totalRevenue ?? 0;
  const attainment = sales.targetAttainmentPct ?? 0;

  return {
    answer: `### Sales vs Employee Performance\n\n| Metric | Value |\n|---|---:|\n| Average employee performance | ${Number(employeeAverage || 0).toFixed(2)} / 5 |\n| Total sales revenue | ${asCurrency(totalRevenue)} |\n| Sales target attainment | ${Number(attainment || 0).toFixed(1)}% |\n\n### Interpretation\nSales performance is currently reported at ${Number(attainment || 0).toFixed(1)}% target attainment, while the average employee performance rating is ${Number(employeeAverage || 0).toFixed(2)}/5. These metrics describe different dimensions of the organization and should not be treated as directly equivalent.\n\n### Key Observation\nThe active dataset supports a descriptive comparison, but it does not establish that employee performance directly caused the sales result.`,
    insights: [
      `Average employee performance is ${Number(employeeAverage || 0).toFixed(2)}/5.`,
      `Sales target attainment is ${Number(attainment || 0).toFixed(1)}%.`,
    ],
    recommendations: [],
  };
};

const makeWhyAnalysisAnswer = (message, findings = [], context = {}) => {
  const hr = findings.find((f) => f?.agent === "HR Agent")?.data || {};
  const performanceTrend = hr.performanceTrend || null;
  const avgPerformance = hr.averagePerformanceRating ?? getEmployeeMetrics(context).averagePerformance;
  const avgSatisfaction = hr.averageSatisfaction ?? 0;

  if (performanceTrend?.available) {
    return {
      answer: `### Employee Performance Trend\n\nThe dataset contains enough historical performance data to analyze a change.\n\n**Direction:** ${performanceTrend.direction}\n**Change:** ${Math.abs(performanceTrend.changePct)}%\n\nThis indicates performance has moved ${performanceTrend.direction} across the tracked periods.`,
      insights: [`Performance trend is ${performanceTrend.direction} by ${Math.abs(performanceTrend.changePct)}%.`],
      recommendations: [],
    };
  }

  return {
    answer: `### Employee Performance\n\nThe current dataset contains employee performance ratings, but it does not provide historical performance measurements over time. Because of that, I cannot reliably determine why performance is changing.\n\n### Available Evidence\n- Average performance rating: ${Number(avgPerformance || 0).toFixed(2)} / 5\n- Average job satisfaction: ${Number(avgSatisfaction || 0).toFixed(2)} / 5\n\nThese values describe the current dataset but do not establish a performance trend.`,
    insights: ["The dataset does not contain sufficient time-series performance data to explain a change."],
    recommendations: [],
  };
};

const makeRiskAnswer = (findings = []) => {
  const lines = findings.flatMap((finding) => finding?.findings || []).filter(Boolean);
  const risks = [];

  if (lines.some((line) => /attrition/i.test(line))) {
    const attritionLine = lines.find((line) => /attrition/i.test(line));
    risks.push(`**1. Employee Attrition** — ${attritionLine}`);
  }
  if (lines.some((line) => /expense|profit|margin/i.test(line))) {
    const financeLine = lines.find((line) => /expense|profit|margin/i.test(line));
    risks.push(`**2. Cost Pressure** — ${financeLine}`);
  }
  if (lines.some((line) => /defect|utilization|downtime|delivery/i.test(line))) {
    const opsLine = lines.find((line) => /defect|utilization|downtime|delivery/i.test(line));
    risks.push(`**3. Operational Performance** — ${opsLine}`);
  }

  if (!risks.length) {
    return {
      answer: `### Key Business Risks\n\nThe active dataset does not show a clear risk signal for the requested question, so there is no verified risk profile to report.`,
      insights: ["No clear risk signal is supported by the active dataset."],
      recommendations: [],
    };
  }

  return {
    answer: `### Key Business Risks\n\n${risks.join("\n\n")}\n\n### Evidence\nThese risks are based on the corresponding metrics available in the active dataset.`,
    insights: risks,
    recommendations: [],
  };
};

const makeExecutiveSummaryAnswer = (message, findings = [], context = {}) => {
  const hr = findings.find((f) => f?.agent === "HR Agent")?.data || {};
  const sales = findings.find((f) => f?.agent === "Sales Agent")?.data || {};
  const finance = findings.find((f) => f?.agent === "Finance Agent")?.data || {};
  const marketing = findings.find((f) => f?.agent === "Marketing Agent")?.data || {};
  const ops = findings.find((f) => f?.agent === "Operations Agent")?.data || {};

  const rows = [
    ["HR", "Avg. performance", `${Number(hr.averagePerformanceRating || 0).toFixed(2)} / 5`],
    ["HR", "Avg. satisfaction", `${Number(hr.averageSatisfaction || 0).toFixed(2)} / 5`],
    ["Finance", "Revenue", asCurrency(finance.totalRevenue || 0)],
    ["Finance", "Expenses", asCurrency(finance.totalExpenses || 0)],
    ["Sales", "Revenue", asCurrency(sales.totalRevenue || 0)],
    ["Sales", "Target attainment", `${Number(sales.targetAttainmentPct || 0).toFixed(1)}%`],
    ["Operations", "Capacity utilization", `${Number(ops.utilizationPct || 0).toFixed(0)}%`],
    ["Marketing", "Top campaign ROI", `${Number(marketing.topCampaign?.roiPct || 0).toFixed(1)}%`],
  ].filter(([, , value]) => value && value !== "$0" && value !== "0%" && value !== "0 / 5");

  return {
    answer: `### Executive Summary\n\nThe active dataset contains enough information to summarize current operational and business performance across the available domains.\n\n### Key Metrics\n\n| Area | Metric | Value |\n|---|---|---:|\n${rows.map(([area, metric, value]) => `| ${area} | ${metric} | ${value} |`).join("\n")}\n\n### Key Findings\n- The current dataset supports a business-level summary across HR, sales, finance, marketing, and operations.\n- The most relevant results are grounded in the specialist findings returned for this question.\n\n### Areas to Watch\n- Employee retention\n- Cost structure\n- Operational efficiency\n\n### Recommendations\nOnly the recommendations directly supported by the underlying dataset should be used.`,
    insights: rows.map(([area, metric, value]) => `${area}: ${metric} = ${value}`),
    recommendations: ["Review the highest-risk metrics in the relevant domain before making operational changes."],
  };
};

export function runExecutiveAgent({ message, findings = [], dataset, context, aiStatus }) {
  const activeFindings = findings.filter((f) => f && (f.agent !== "Data Analyst Agent" || f.findings?.length));
  const unsupportedResult = activeFindings.find((f) => f.canAnswer === false || f.available === false);

  if (unsupportedResult && unsupportedResult.unsupportedReason) {
    const reason = unsupportedResult.unsupportedReason;
    const availableInsights = activeFindings.flatMap((f) => f.findings || []).filter((line) => !line.includes("can't determine") && !line.includes("does not contain"));
    const summary = `I can't determine the answer to "${message}" from the active dataset because the required field is not present.`;
    const keyFindings = availableInsights.length ? availableInsights : [`The active dataset does not contain the required fields to answer "${message}".`];

    return {
      answer: `### Unsupported Data Request\n\n${summary}\n\n### Available Evidence\n${asList(keyFindings.length ? keyFindings : ["No supporting field is present in the active dataset."])}\n\nThis is a dataset limitation rather than a business result.`,
      insights: keyFindings,
      recommendations: [],
      aiStatus,
    };
  }

  const questionType = classifyQuestionType(message, activeFindings);
  const safeContext = context || {};

  if (questionType === "EXECUTIVE_SUMMARY") {
    return { ...makeExecutiveSummaryAnswer(message, activeFindings, safeContext), aiStatus };
  }
  if (questionType === "RANKING") {
    return { ...makeRankingAnswer(safeContext, activeFindings), aiStatus };
  }
  if (questionType === "COMPARISON") {
    return { ...makeComparisonAnswer(message, activeFindings, safeContext), aiStatus };
  }
  if (questionType === "WHY_ANALYSIS") {
    return { ...makeWhyAnalysisAnswer(message, activeFindings, safeContext), aiStatus };
  }
  if (questionType === "RISK_ANALYSIS") {
    return { ...makeRiskAnswer(activeFindings), aiStatus };
  }
  if (questionType === "DIRECT_LOOKUP") {
    return { ...makeDirectLookupAnswer(message, activeFindings, safeContext), aiStatus };
  }

  const primarySpecialist = activeFindings.find((f) => f.agent !== "Data Analyst Agent" && f.findings?.length) || activeFindings[0];
  const allFindings = activeFindings.flatMap((f) => f.findings || []);
  const headline = primarySpecialist?.findings?.[0] || "The active dataset supports a domain-specific answer.";

  return {
    answer: `### ${primarySpecialist?.agent || "Analysis"}\n\n${headline}\n\n### Evidence\n${asList(allFindings.length ? allFindings : ["No dataset-grounded findings were available for this question."])}\n\nThis response is based on the active dataset and the selected specialist results.`,
    insights: allFindings,
    recommendations: [],
    aiStatus,
  };
}

