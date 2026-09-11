const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const FRONTEND_ORIGIN =
  typeof window !== "undefined" ? window.location.origin : "your frontend origin";

const createNetworkError = () =>
  new Error(
    `Unable to reach ${API_BASE_URL}. Check VITE_API_BASE_URL and make sure backend CLIENT_ORIGIN allows ${FRONTEND_ORIGIN}.`
  );

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    const networkError = createNetworkError();
    networkError.cause = error;
    throw networkError;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      payload?.message ||
      `Authentication request failed (HTTP ${response.status}).`;
    const error = new Error(message);
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function signupRequest({ name, email, password, role }) {
  return request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password, role }),
  });
}

export function loginRequest({ email, password }) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchMeRequest(token) {
  return request("/api/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateAvatarRequest({ token, avatar }) {
  return request("/api/auth/avatar", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ avatar }),
  });
}

export function removeAvatarRequest(token) {
  return request("/api/auth/avatar", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateProfileRequest({ token, name, email }) {
  return request("/api/auth/profile", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, email }),
  });
}

export { API_BASE_URL };
