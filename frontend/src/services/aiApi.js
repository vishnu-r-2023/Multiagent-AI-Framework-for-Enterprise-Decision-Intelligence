import { API_BASE_URL } from "./analyticsApi";

const AUTH_STORAGE_KEY = "enterprise-dashboard-auth";

const getToken = () => {
  try {
    return JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) || "{}")?.token || null;
  } catch {
    return null;
  }
};

export async function askPerformIqAi(message, history = []) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
      body: JSON.stringify({ message, history }),
    });
  } catch {
    throw new Error("Unable to reach the AI service. The rest of PerformIQ remains available.");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "AI request failed.");
  return payload;
}
