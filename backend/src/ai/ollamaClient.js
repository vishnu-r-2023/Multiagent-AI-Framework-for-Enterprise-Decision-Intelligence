const DEFAULT_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_TIMEOUT_MS = 8000;

const getConfig = () => ({
  enabled: String(process.env.AI_PROVIDER || "ollama").toLowerCase() === "ollama",
  baseUrl: String(process.env.OLLAMA_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, ""),
  model: String(process.env.OLLAMA_MODEL || "llama3.2:3b").trim(),
  timeoutMs: Math.max(1000, Number(process.env.OLLAMA_TIMEOUT_MS || DEFAULT_TIMEOUT_MS)),
});

async function requestOllama(path, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(path, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`Ollama returned ${response.status}.`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function getOllamaStatus() {
  const config = getConfig();
  if (!config.enabled) return { status: "disabled", provider: "ollama", model: config.model };
  try {
    await requestOllama(`${config.baseUrl}/api/version`, { method: "GET" }, Math.min(config.timeoutMs, 2500));
    return { status: "online", provider: "ollama", model: config.model };
  } catch (_error) {
    return { status: "offline", provider: "ollama", model: config.model };
  }
}

export async function createLocalInterpretation({ message, facts }) {
  const config = getConfig();
  if (!config.enabled || !facts.length) return null;

  const prompt = [
    "You are a local enterprise insight assistant.",
    "Write one concise business interpretation of the supplied verified facts.",
    "Do not introduce numbers, causes, facts, names, employee IDs, or claims not explicitly supported. Preserve every employee ID exactly as written; never invent or reformat an ID. Do not give instructions.",
    `Question: ${message}`,
    "Verified facts:",
    ...facts.map((fact) => `- ${fact}`),
  ].join("\n");

  try {
    const payload = await requestOllama(
      `${config.baseUrl}/api/generate`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: config.model, prompt, stream: false, options: { temperature: 0.1, num_predict: 90 } }) },
      config.timeoutMs
    );
    const interpretation = String(payload?.response || "").replace(/\s+/g, " ").trim();
    if (!interpretation || interpretation.length > 800) return null;

    const verifiedEmployeeIds = new Set(
      facts.flatMap((fact) => String(fact).match(/\b(?:emp|employee|e)[-_]?\d+\b/gi) || []).map((id) => id.toLowerCase())
    );
    const interpretationEmployeeIds = String(interpretation).match(/\b(?:emp|employee|e)[-_]?\d+\b/gi) || [];
    if (interpretationEmployeeIds.some((id) => !verifiedEmployeeIds.has(id.toLowerCase()))) return null;

    return interpretation;
  } catch (_error) {
    return null;
  }
}
