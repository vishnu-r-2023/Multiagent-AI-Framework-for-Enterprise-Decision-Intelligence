import {
  analyzeFinanceQuestion,
  analyzeHrQuestion,
  analyzeMarketingQuestion,
  analyzeOperationsQuestion,
  analyzeSalesQuestion,
  compareEmployeeAndSales,
  getEmployeeStatistics,
  getSalesSummary,
} from "../tools/analyticsTools.js";

const unavailableFinding = (agent, result) => ({
  agent,
  available: false,
  canAnswer: false,
  unsupportedReason: result?.unsupportedReason || result?.message || "Data unavailable",
  findings: result?.findings || [result?.message || "Data unavailable"],
  data: result?.metrics || {},
});

export function runHrAgent(context, message = "", _requestTrace = null) {
  const result = analyzeHrQuestion(context, message);
  if (!result.available) return unavailableFinding("HR Agent", result);
  return {
    agent: "HR Agent",
    available: true,
    canAnswer: result.canAnswer !== false,
    unsupportedReason: result.unsupportedReason || null,
    findings: result.findings,
    data: result.metrics,
    intent: result.intent,
  };
}

export function runSalesAgent(context, message = "", _requestTrace = null) {
  const result = analyzeSalesQuestion(context, message);
  if (!result.available) return unavailableFinding("Sales Agent", result);
  return {
    agent: "Sales Agent",
    available: true,
    canAnswer: result.canAnswer !== false,
    unsupportedReason: result.unsupportedReason || null,
    findings: result.findings,
    data: result.metrics,
    intent: result.intent,
  };
}

export function runFinanceAgent(context, message = "", _requestTrace = null) {
  const result = analyzeFinanceQuestion(context, message);
  if (!result.available) return unavailableFinding("Finance Agent", result);
  return {
    agent: "Finance Agent",
    available: true,
    canAnswer: result.canAnswer !== false,
    unsupportedReason: result.unsupportedReason || null,
    findings: result.findings,
    data: result.metrics,
    intent: result.intent,
  };
}

export function runMarketingAgent(context, message = "", _requestTrace = null) {
  const result = analyzeMarketingQuestion(context, message);
  if (!result.available) return unavailableFinding("Marketing Agent", result);
  return {
    agent: "Marketing Agent",
    available: true,
    canAnswer: result.canAnswer !== false,
    unsupportedReason: result.unsupportedReason || null,
    findings: result.findings,
    data: result.metrics,
    intent: result.intent,
  };
}

export function runOperationsAgent(context, message = "", _requestTrace = null) {
  const result = analyzeOperationsQuestion(context, message);
  if (!result.available) return unavailableFinding("Operations Agent", result);
  return {
    agent: "Operations Agent",
    available: true,
    canAnswer: result.canAnswer !== false,
    unsupportedReason: result.unsupportedReason || null,
    findings: result.findings,
    data: result.metrics,
    intent: result.intent,
  };
}

export function runDataAnalystAgent(context, agentResults = [], message = "", _requestTrace = null) {
  const hr = agentResults.find((r) => r.agent === "HR Agent")?.data || getEmployeeStatistics(context);
  const sales = agentResults.find((r) => r.agent === "Sales Agent")?.data || getSalesSummary(context);
  const comparison = compareEmployeeAndSales(context, hr, sales);
  const findings = [];
  if (comparison.available && comparison.correlation?.available) {
    findings.push(
      `Across ${comparison.comparedDepartments} comparable departments, employee performance and sales revenue have a ${comparison.correlation.strength} correlation (r=${comparison.correlation.coefficient}). Correlation does not establish causation.`
    );
  } else if (comparison.available && comparison.correlation?.message) {
    findings.push(comparison.correlation.message);
  } else if (comparison.message) {
    findings.push(comparison.message);
  }

  return { agent: "Data Analyst Agent", available: true, canAnswer: true, findings, data: { comparison } };
}

