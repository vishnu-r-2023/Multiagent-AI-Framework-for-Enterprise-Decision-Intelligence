const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const AUTH_STORAGE_KEY = "enterprise-dashboard-auth";
const FRONTEND_ORIGIN =
  typeof window !== "undefined" ? window.location.origin : "your frontend origin";

const createNetworkError = () =>
  new Error(
    `Unable to reach ${API_BASE_URL}. Check VITE_API_BASE_URL and make sure backend CLIENT_ORIGIN allows ${FRONTEND_ORIGIN}.`
  );

const readStoredToken = () => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const token = String(parsed?.token || "").trim();
    return token || null;
  } catch {
    return null;
  }
};

async function request(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  const token = readStoredToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    const networkError = createNetworkError();
    networkError.cause = error;
    throw networkError;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.message || payload?.issues?.[0] || "Request failed.";
    const error = new Error(message);
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function fetchAnalyticsBootstrap() {
  return request("/api/analytics/bootstrap");
}

export async function uploadDatasetFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  return request("/api/analytics/dataset/upload", {
    method: "POST",
    body: formData,
  });
}

export async function clearDataset() {
  return request("/api/analytics/dataset", {
    method: "DELETE",
  });
}

export async function switchDataset(datasetId) {
  return request("/api/analytics/dataset/switch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ datasetId }),
  });
}

export async function deleteDataset(datasetId) {
  return request(`/api/analytics/dataset/${encodeURIComponent(datasetId)}`, {
    method: "DELETE",
  });
}

export { API_BASE_URL };
