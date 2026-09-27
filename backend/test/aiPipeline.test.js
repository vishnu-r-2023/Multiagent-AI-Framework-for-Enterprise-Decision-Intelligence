import fs from "fs";
import { fileURLToPath } from "url";
import assert from "assert";
import { detectIntent, normalizeFollowUpQuestion, runAiOrchestration, selectAgents } from "../src/ai/orchestratorAgent.js";
import { runExecutiveAgent } from "../src/ai/agents/executiveAgent.js";
import {
  analyzeHrQuestion,
  analyzeSalesQuestion,
  analyzeFinanceQuestion,
  analyzeMarketingQuestion,
  analyzeOperationsQuestion,
} from "../src/ai/tools/analyticsTools.js";

// Mock dataset context for testing
const mockContext = {
  hasDataset: true,
  dataset: {
    id: "test-ds-1",
    fileName: "Enterprise_Q3_Sample.xlsx",
    source: "enterprise-workbook",
    recordCount: 250,
  },
  employees: [
    { employeeId: "E001", department: "Sales", jobRole: "Sales Rep", monthlyIncome: 6000, performanceRating: 3.1, jobSatisfaction: 3.2, attrition: true, workLifeBalance: 3.0 },
    { employeeId: "E002", department: "Sales", jobRole: "Sales Rep", monthlyIncome: 6500, performanceRating: 3.3, jobSatisfaction: 3.5, attrition: true, workLifeBalance: 3.2 },
    { employeeId: "E003", department: "Engineering", jobRole: "Software Engineer", monthlyIncome: 9000, performanceRating: 4.2, jobSatisfaction: 4.1, attrition: false, workLifeBalance: 4.0 },
    { employeeId: "E004", department: "Engineering", jobRole: "Senior Engineer", monthlyIncome: 11000, performanceRating: 4.5, jobSatisfaction: 4.3, attrition: false, workLifeBalance: 3.8 },
    { employeeId: "E005", department: "Marketing", jobRole: "Marketer", monthlyIncome: 5500, performanceRating: 3.6, jobSatisfaction: 3.9, attrition: false, workLifeBalance: 3.5 },
  ],
  salesRecords: [
    { salesDate: "2026-01-15", department: "Sales", revenue: 1250000, target: 1000000, orders: 450, region: "South", productCategory: "Enterprise SaaS" },
    { salesDate: "2026-01-15", department: "Sales", revenue: 980000, target: 900000, orders: 320, region: "North", productCategory: "Hardware" },
    { salesDate: "2026-01-15", department: "Marketing", revenue: 450000, target: 500000, orders: 150, region: "East", productCategory: "Services" },
  ],
  marketingRecords: [
    { marketingDate: "2026-01-15", channel: "Search Ads", campaign: "Q3 Growth", spend: 50000, revenue: 350000, conversions: 1200 },
    { marketingDate: "2026-01-15", channel: "Social Media", campaign: "Brand Awareness", spend: 30000, revenue: 90000, conversions: 400 },
  ],
  financeRecords: [
    { financeDate: "2026-01-15", department: "Sales", revenue: 2230000, expenses: 1400000, netProfit: 830000 },
    { financeDate: "2026-01-15", department: "Engineering", revenue: 0, expenses: 950000, netProfit: -950000 },
    { financeDate: "2026-01-15", department: "Marketing", revenue: 450000, expenses: 320000, netProfit: 130000 },
  ],
  operationsRecords: [
    { operationsDate: "2026-01-15", department: "Logistics", processName: "Order Fulfillment", utilizationPct: 88.5, defectRatePct: 4.2, onTimeDeliveryPct: 94.1, downtimeMinutes: 120 },
    { operationsDate: "2026-01-15", department: "Assembly", processName: "Hardware Assembly", utilizationPct: 62.0, defectRatePct: 8.7, onTimeDeliveryPct: 82.5, downtimeMinutes: 450 },
  ],
};

async function runTests() {
  const outputLines = [];
  function log(msg) {
    console.log(msg);
    outputLines.push(msg);
  }

  log("=================================================");
  log("       PERFORMIQ AI PIPELINE VALIDATION SUITE    ");
  log("=================================================\n");

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      log(`[PASS] Test ${total}: ${name}`);
      passed++;
    } catch (err) {
      log(`[FAIL] Test ${total}: ${name}`);
      log(`       Error: ${err.message}`);
    }
  }

  test("Intent detection routes specific HR questions to HR", () => {
    assert.strictEqual(detectIntent("Which department has the highest employee satisfaction?"), "hr");
    assert.strictEqual(detectIntent("Which region has the highest sales?"), "sales");
    assert.strictEqual(detectIntent("What are the total expenses?"), "finance");
    assert.strictEqual(detectIntent("Which campaign performed best?"), "marketing");
    assert.strictEqual(detectIntent("Which operational area has the lowest efficiency?"), "operations");
    assert.strictEqual(detectIntent("How is performance?"), "ambiguous");
  });

  test("Agent selection respects the actual question, not generic keywords", () => {
    const selected = selectAgents("Which department has the highest employee satisfaction?", mockContext, "hr");
    assert.deepStrictEqual(selected, ["HR Agent"]);
    assert.ok(!selected.includes("Sales Agent"));
    assert.ok(!selected.includes("Finance Agent"));
  });

  test("Best employee answers use an employee ID from the active dataset", () => {
    const result = runExecutiveAgent({
      message: "Who is the best employee?",
      findings: [],
      context: mockContext,
      aiStatus: "offline",
    });
    assert.ok(result.answer.includes("E004"));
    assert.ok(!result.answer.includes("emp0008"));
    assert.ok(result.insights[0].includes("employee ID: E004"));
    assert.ok(result.answer.includes("Ranking Score"));
  });

  test("Follow-up questions keep the current context grounded to the previous department", () => {
    const enriched = normalizeFollowUpQuestion("Why is that department performing poorly?", ["Which department has the highest employee satisfaction?"]);
    assert.ok(enriched.includes("highest employee satisfaction"));
  });

  // 1. HR Question Test
  test("HR Routing & Analysis - Attrition Question", () => {
    const res = analyzeHrQuestion(mockContext, "Which department has the highest attrition?");
    assert.strictEqual(res.agent, "HR Agent");
    assert.strictEqual(res.canAnswer, true);
    assert.strictEqual(res.metrics.highestAttritionDepartment.department, "Sales");
    assert.ok(res.findings.some((f) => f.includes("Sales department has the highest attrition rate")));
  });

  // 2. Sales Question Test
  test("Sales Routing & Analysis - Revenue Question", () => {
    const res = analyzeSalesQuestion(mockContext, "Which region generated the highest revenue?");
    assert.strictEqual(res.agent, "Sales Agent");
    assert.strictEqual(res.canAnswer, true);
    assert.strictEqual(res.metrics.topRegion.region, "South");
    assert.ok(res.findings.some((f) => f.includes("South region generated the highest sales revenue")));
  });

  // 3. Finance Question Test
  test("Finance Routing & Analysis - Total Expenses Question", () => {
    const res = analyzeFinanceQuestion(mockContext, "What are our total expenses?");
    assert.strictEqual(res.agent, "Finance Agent");
    assert.strictEqual(res.canAnswer, true);
    assert.strictEqual(res.metrics.totalExpenses, 2670000);
    assert.ok(res.findings.some((f) => f.includes("Total financial expenses across all departments equal $2,670,000")));
  });

  // 4. Marketing Question Test
  test("Marketing Routing & Analysis - Best Campaign Question", () => {
    const res = analyzeMarketingQuestion(mockContext, "Which campaign performed best?");
    assert.strictEqual(res.agent, "Marketing Agent");
    assert.strictEqual(res.canAnswer, true);
    assert.strictEqual(res.metrics.topCampaign.campaign, "Q3 Growth");
    assert.ok(res.findings.some((f) => f.includes("Q3 Growth")));
  });

  // 5. Operations Question Test
  test("Operations Routing & Analysis - Bottlenecks & Efficiency Question", () => {
    const res = analyzeOperationsQuestion(mockContext, "Which operational area has the lowest efficiency?");
    assert.strictEqual(res.agent, "Operations Agent");
    assert.strictEqual(res.canAnswer, true);
    assert.strictEqual(res.metrics.highestDefectDepartment.department, "Assembly");
    assert.ok(res.findings.some((f) => f.includes("Assembly has the highest average defect rate")));
  });

  // 6. Unsupported Question Test
  test("Unsupported Question Handling - Customer Lifetime Value", () => {
    const res = analyzeSalesQuestion(mockContext, "What is the average customer lifetime value?");
    assert.strictEqual(res.canAnswer, false);
    assert.ok(res.unsupportedReason.includes("customer lifetime value"));
    assert.ok(res.findings[0].includes("can't determine"));
  });

  // 7. Distinct Answers Test
  test("Different questions produce meaningfully different output answers", () => {
    const hrAns = analyzeHrQuestion(mockContext, "Which department has the highest attrition?");
    const salesAns = analyzeSalesQuestion(mockContext, "Which region generated the highest revenue?");
    const finAns = analyzeFinanceQuestion(mockContext, "What are total expenses?");

    assert.notStrictEqual(hrAns.findings[0], salesAns.findings[0]);
    assert.notStrictEqual(salesAns.findings[0], finAns.findings[0]);
    assert.ok(hrAns.findings[0].includes("attrition"));
    assert.ok(salesAns.findings[0].includes("South region"));
    assert.ok(finAns.findings[0].includes("2,670,000"));
  });

  log(`\nResults: ${passed}/${total} tests passed.\n`);
  const outputPath = fileURLToPath(new URL("./test_output.txt", import.meta.url));
  fs.writeFileSync(outputPath, outputLines.join("\n"));
  if (passed !== total) process.exit(1);
}

runTests();

