import { runExecutiveAgent } from "./agents/executiveAgent.js";
import {
  runDataAnalystAgent,
  runFinanceAgent,
  runHrAgent,
  runMarketingAgent,
  runOperationsAgent,
  runSalesAgent,
} from "./agents/specialistAgents.js";
import { createLocalInterpretation, getOllamaStatus } from "./ollamaClient.js";
import { getActiveDatasetContext } from "./tools/analyticsTools.js";

const KEYWORDS = {
  hr: /employee|employees|people|workforce|attrition|turnover|satisfaction|job role|staff|talent|salary|income|compensation|work-life|attendance|absent|late|payroll|performance rating|performance/i,
  sales: /sales|revenue|target|attainment|customer|product|segment|region|territory|pipeline|order|units sold|sales rep|department revenue/i,
  finance: /finance|profit|expense|expenses|margin|budget|financial|cost|spending|spent|net profit|cash flow/i,
  marketing: /marketing|campaign|channel|conversion|lead|roi|spend|impressions|clicks|visitors|brand|acquisition/i,
  operations: /operation|operational|efficien|process|bottleneck|utilization|defect|delivery|inventory|downtime|cycle time|shift|sla|capacity/i,
  executive: /executive|organization|organisation|summary|risk|attention|complete|business|overall|compare sales and employee|relationship|correlation|business performance/i,
};

const matchDomains = (message) => {
  const text = String(message || "").toLowerCase();
  if (!text.trim()) return {};

  const scoreMap = { hr: 0, sales: 0, finance: 0, marketing: 0, operations: 0, executive: 0 };
  for (const [domain, pattern] of Object.entries(KEYWORDS)) {
    if (pattern.test(text)) {
      scoreMap[domain] += 1;
    }
  }

  if (/(employee|hr|people|workforce).*performance|performance.*(employee|hr|people|workforce)/i.test(text)) scoreMap.hr += 2;
  if (/(sales|revenue|region).*performance|performance.*(sales|revenue|region)/i.test(text)) scoreMap.sales += 2;
  if (/(finance|expense|profit).*performance|performance.*(finance|expense|profit)/i.test(text)) scoreMap.finance += 2;
  if (/(marketing|campaign|channel).*performance|performance.*(marketing|campaign|channel)/i.test(text)) scoreMap.marketing += 2;
  if (/(operational|efficiency|bottleneck|defect).*performance|performance.*(operational|efficiency|bottleneck|defect)/i.test(text)) scoreMap.operations += 2;

  if (/(overall|business|organization|executive|summary|performance summary|business performance)/i.test(text)) {
    scoreMap.executive += 2;
  }

  if (/how\s+is\s+performance\??/i.test(text)) {
    scoreMap.hr += 0;
    scoreMap.sales += 0;
    scoreMap.finance += 0;
    scoreMap.marketing += 0;
    scoreMap.operations += 0;
    scoreMap.executive = 0;
  }

  return scoreMap;
};

export function detectIntent(message) {
  const text = String(message || "").trim();
  if (!text) return "ambiguous";
  const lower = text.toLowerCase();

  if (/^\s*how\s+is\s+performance\??\s*$/i.test(text)) return "ambiguous";
  if (/\b(executive summary|overall business performance|organization summary|business performance|summary of.*business|give me an executive summary|business performance summary)\b/i.test(text)) {
    return "executive";
  }

  const categoryPatterns = [
    { domain: "hr", pattern: /employee|employees|workforce|attrition|turnover|satisfaction|job role|salary|income|payroll|performance rating|performance/ },
    { domain: "sales", pattern: /sales|revenue|region|territory|target|attainment|product|orders|pipeline/ },
    { domain: "finance", pattern: /finance|expenses?|profit|margin|budget|cost|spending|net profit/ },
    { domain: "marketing", pattern: /marketing|campaign|channel|conversion|lead|roi|spend|clicks|impressions|visitors/ },
    { domain: "operations", pattern: /operations?|efficiency|bottleneck|utilization|defect|delivery|inventory|downtime|cycle time|capacity/ },
  ];

  const matches = categoryPatterns.filter(({ pattern }) => pattern.test(lower)).map(({ domain }) => domain);
  if (!matches.length) return "ambiguous";
  if (matches.length > 1) return "cross_domain";
  return matches[0];
}

export function selectAgents(message, context, intent) {
  const selected = [];

  const addIfData = (name, hasData, condition) => {
    if (hasData && condition && !selected.includes(name)) {
      selected.push(name);
    }
  };

  const hasHr = Boolean(context.employees?.length);
  const hasSales = Boolean(context.salesRecords?.length);
  const hasFinance = Boolean(context.financeRecords?.length);
  const hasMarketing = Boolean(context.marketingRecords?.length);
  const hasOps = Boolean(context.operationsRecords?.length);

  const domainMatches = matchDomains(message);
  const matchedDomains = Object.entries(domainMatches)
    .filter(([, value]) => value > 0)
    .map(([domain]) => domain)
    .filter((domain) => domain !== "executive");

  if (intent === "hr") {
    addIfData("HR Agent", hasHr, true);
  } else if (intent === "sales") {
    addIfData("Sales Agent", hasSales, true);
  } else if (intent === "finance") {
    addIfData("Finance Agent", hasFinance, true);
  } else if (intent === "marketing") {
    addIfData("Marketing Agent", hasMarketing, true);
  } else if (intent === "operations") {
    addIfData("Operations Agent", hasOps, true);
  } else if (intent === "cross_domain" || intent === "executive") {
    if (matchedDomains.includes("hr")) addIfData("HR Agent", hasHr, true);
    if (matchedDomains.includes("sales")) addIfData("Sales Agent", hasSales, true);
    if (matchedDomains.includes("finance")) addIfData("Finance Agent", hasFinance, true);
    if (matchedDomains.includes("marketing")) addIfData("Marketing Agent", hasMarketing, true);
    if (matchedDomains.includes("operations")) addIfData("Operations Agent", hasOps, true);

    if (!selected.length) {
      if (hasHr) selected.push("HR Agent");
      if (hasSales) selected.push("Sales Agent");
      if (hasFinance) selected.push("Finance Agent");
      if (hasMarketing) selected.push("Marketing Agent");
      if (hasOps) selected.push("Operations Agent");
    }
  } else if (matchedDomains.length) {
    if (matchedDomains.includes("hr")) addIfData("HR Agent", hasHr, true);
    if (matchedDomains.includes("sales")) addIfData("Sales Agent", hasSales, true);
    if (matchedDomains.includes("finance")) addIfData("Finance Agent", hasFinance, true);
    if (matchedDomains.includes("marketing")) addIfData("Marketing Agent", hasMarketing, true);
    if (matchedDomains.includes("operations")) addIfData("Operations Agent", hasOps, true);
  }

  if (!selected.length) {
    if (hasHr && /employee|attrition|satisfaction|performance/i.test(message)) selected.push("HR Agent");
    if (hasSales && /sales|revenue|region|target|product/i.test(message)) selected.push("Sales Agent");
    if (hasFinance && /expense|profit|finance|margin|budget/i.test(message)) selected.push("Finance Agent");
    if (hasMarketing && /campaign|marketing|lead|conversion|channel/i.test(message)) selected.push("Marketing Agent");
    if (hasOps && /operations|efficiency|defect|utilization|downtime|delivery/i.test(message)) selected.push("Operations Agent");
  }

  if (!selected.length && hasHr) selected.push("HR Agent");
  return selected;
}

function validateResponse({ answer, message, findings }) {
  if (!answer || typeof answer !== "string") {
    return { valid: false, reason: "Response answer is empty." };
  }
  const genericBoilerplate = "the analysis found 8 evidence-backed observations relevant to";
  const genericPatterns = [
    /overall business performance is strong/i,
    /overall business performance is healthy/i,
    /the analysis found .* evidence-backed observations/i,
    /business performance remains strong/i,
  ];
  if (answer.includes(genericBoilerplate) || genericPatterns.some((pattern) => pattern.test(answer))) {
    return { valid: false, reason: "Response contained static generic boilerplate." };
  }

  const normalizedQuestion = String(message || "").toLowerCase();
  const domainTerms = {
    hr: /(employee|attrition|satisfaction|performance|workforce)/i,
    sales: /(sales|revenue|region|product|revenue)/i,
    finance: /(expense|expenses|profit|margin|budget|financial)/i,
    marketing: /(campaign|marketing|lead|conversion|channel|roi)/i,
    operations: /(operation|efficiency|defect|utilization|bottleneck|delivery)/i,
  };

  const matchedDomain = Object.entries(domainTerms).find(([, regex]) => regex.test(normalizedQuestion));
  if (matchedDomain && !domainTerms[matchedDomain[0]].test(answer)) {
    return { valid: false, reason: `Response does not match the ${matchedDomain[0]} domain question.` };
  }

  return { valid: true };
}

export function normalizeFollowUpQuestion(message, history = []) {
  const current = String(message || "").trim();
  if (!current) return current;
  if (!/^why\b|^what explains\b|^what caused\b|^what is driving\b/i.test(current)) return current;

  const lastUserQuestion = [...history].reverse().find((entry) => {
    const text = typeof entry === "string" ? entry : String(entry?.message || entry?.question || "");
    return text.trim();
  });
  if (!lastUserQuestion) return current;

  const lastQuestionText = typeof lastUserQuestion === "string" ? lastUserQuestion : String(lastUserQuestion.message || lastUserQuestion.question || "");
  const lastMatch = lastQuestionText.match(/(?:department|region|campaign|channel|team|process|product|area)[^?.]*?/i);
  if (lastMatch && /\bthat\b|\bthis\b/i.test(current)) {
    return `${current} Previous context: ${lastQuestionText}`;
  }

  return current;
}

export async function runAiOrchestration({ userId, message, history = [] }) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const effectiveMessage = normalizeFollowUpQuestion(message, history);

  const [context, ollama] = await Promise.all([getActiveDatasetContext(userId), getOllamaStatus()]);

  if (!context.hasDataset) {
    return {
      success: true,
      answer: "## Executive Summary\nNo active dataset is available for data-driven analysis. Upload and select a dataset first.\n\n## Key Findings\n- Insufficient data is available to determine this.\n\n## Recommendations\n- Upload a CSV or enterprise XLSX dataset, then ask your question again.",
      agentsUsed: ["Orchestrator Agent", "Executive Insight Agent"],
      insights: ["No active dataset is available."],
      recommendations: ["Upload and select a dataset before requesting data-driven analysis."],
      metadata: { requestId, aiStatus: ollama.status, provider: ollama.provider, model: ollama.model, dataset: null, localInterpretation: null },
    };
  }

  // Handle ambiguous standalone questions like "How is performance?"
  if (/^\s*how\s+is\s+performance\??\s*$/i.test(effectiveMessage.trim())) {
    const optionsText = [
      "## Executive Summary",
      "Your question 'How is performance?' can refer to multiple business domains in PerformIQ.",
      "",
      "## Domain Clarification",
      "Please specify which aspect of performance you would like to analyze:",
      "- **Employee Performance** (HR): Average employee performance ratings, attrition, or department ratings.",
      "- **Sales Performance** (Sales): Revenue generated, target attainment, or regional sales.",
      "- **Marketing Performance** (Marketing): Campaign ROI, lead conversions, or channel effectiveness.",
      "- **Operational Performance** (Operations): Capacity utilization, defect rates, or on-time delivery.",
      "",
      "## Recommendations",
      "- Try asking: 'What is average employee performance?' or 'Analyze sales performance by department.'",
    ].join("\n");

    return {
      success: true,
      answer: optionsText,
      agentsUsed: ["Orchestrator Agent"],
      insights: ["Question requires domain specification."],
      recommendations: [
        "Ask about employee performance for HR metrics.",
        "Ask about sales performance for revenue metrics.",
        "Ask about marketing performance for campaign metrics.",
        "Ask about operational performance for efficiency metrics.",
      ],
      metadata: { requestId, aiStatus: ollama.status, provider: ollama.provider, model: ollama.model, dataset: context.dataset },
    };
  }

  const detectedIntent = detectIntent(effectiveMessage);
  const selectedAgents = selectAgents(effectiveMessage, context, detectedIntent);

  const requestTrace = {
    requestId,
    userId,
    datasetId: context.dataset?.id || null,
    originalQuestion: effectiveMessage,
    detectedIntent,
    selectedAgents,
    specialistResults: [],
    finalResponse: null,
  };

  // Log server-side AI pipeline debug information (excluding sensitive credentials)
  console.log(`[AI] Request ID: ${requestId}`);
  console.log(`[AI] User Question: "${effectiveMessage}"`);
  console.log(`[AI] Dataset: ${context.dataset?.fileName || "None"} (${context.dataset?.recordCount || 0} records)`);
  console.log(`[AI] Detected Intent: ${detectedIntent}`);
  console.log(`[AI] Selected Agents: ${selectedAgents.join(", ")}`);

  const executors = {
    "HR Agent": runHrAgent,
    "Sales Agent": runSalesAgent,
    "Finance Agent": runFinanceAgent,
    "Marketing Agent": runMarketingAgent,
    "Operations Agent": runOperationsAgent,
  };

  const findings = selectedAgents.map((name) => executors[name](context, effectiveMessage, requestTrace));
  requestTrace.specialistResults = findings;

  if (selectedAgents.length > 1 || detectedIntent === "cross_domain" || detectedIntent === "executive") {
    const analyst = runDataAnalystAgent(context, findings, effectiveMessage, requestTrace);
    findings.push(analyst);
  }

  console.log(`[AI] Specialist Results: ${JSON.stringify(findings.map((f) => ({ agent: f.agent, canAnswer: f.canAnswer, findingsCount: f.findings?.length })))}`);

  const executive = runExecutiveAgent({ message: effectiveMessage, findings, dataset: context.dataset, context, aiStatus: ollama.status, requestTrace });
  console.log(`[AI] Executive Response Synthesized: "${executive.answer.substring(0, 120)}..."`);

  const validation = validateResponse({ answer: executive.answer, message: effectiveMessage, selectedAgents, findings });
  if (!validation.valid) {
    console.warn(`[AI] Response validation failed (${validation.reason}). Using Grounded Executive Answer.`);
  }

  const localInterpretation = ollama.status === "online"
    ? await createLocalInterpretation({ message: effectiveMessage, facts: executive.insights.slice(0, 5) })
    : null;

  const finalAnswer = localInterpretation ? `${executive.answer}\n\n## Local AI Interpretation\n${localInterpretation}` : executive.answer;
  requestTrace.finalResponse = finalAnswer;

  console.log(`[AI] Final Response Delivered for Request ID: ${requestId}`);

  requestTrace.finalResponse = finalAnswer;

  return {
    success: true,
    answer: finalAnswer,
    agentsUsed: ["Orchestrator Agent", ...selectedAgents, ...(findings.some((f) => f.agent === "Data Analyst Agent") ? ["Data Analyst Agent"] : []), "Executive Insight Agent"],
    insights: executive.insights,
    recommendations: executive.recommendations,
    metadata: {
      requestId,
      userId,
      datasetId: context.dataset?.id || null,
      originalQuestion: effectiveMessage,
      detectedIntent,
      selectedAgents,
      specialistResults: findings,
      finalResponse: finalAnswer,
      aiStatus: ollama.status,
      provider: ollama.provider,
      model: ollama.model,
      dataset: context.dataset,
      localInterpretation: Boolean(localInterpretation),
    },
  };
}

