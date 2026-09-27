import { USER_ROLES } from "../config/navigation";
import {
  fetchMeRequest,
  loginRequest,
  removeAvatarRequest,
  signupRequest,
  updateProfileRequest,
  updateAvatarRequest,
} from "./authApi";

const AUTH_STORAGE_KEY = "enterprise-dashboard-auth";
const LEGACY_DEFAULT_AVATAR_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCdRGOcYbQAgdQSztklApJCbUn80iyLIoDi4zu8CQvUQLtjPtGVu4ct4RGJhue4Xci7Xk0MlL_dx1I4l7krfvTmlyKiMw-o_cbOdBF1O3I_XaA5CxP6BfQyVW1s-UVN2AVlYctm9HqJxkOUfZmTsliNU0XRatPY-nCTJlZlQtl4lVfd6bRnlcv9BqY9RoknKiiWaWqj40-o9pODdpn15aCwFNDZ6RZvjwkDmjrZQWZukw6-5TwBqUerN_r9SXH-SpN18NFQPHL3048";

const DEFAULT_USER = Object.freeze({
  id: "usr-001",
  name: "Dashboard User",
  email: "user@enterprise.local",
  role: USER_ROLES.EMPLOYEE,
  avatar: null,
});

const normalizeRole = (value) => {
  const role = String(value || "").trim().toLowerCase();
  if (role === "admin" || role === "system admin") return USER_ROLES.ADMIN;
  if (role === "manager" || role === "senior analyst" || role === "cfo office") {
    return USER_ROLES.MANAGER;
  }
  if (role === "employee") return USER_ROLES.EMPLOYEE;
  return USER_ROLES.EMPLOYEE;
};

const normalizeName = (value) => {
  const name = String(value || "").trim();
  if (!name) return DEFAULT_USER.name;
  return name;
};

const normalizeEmail = (value) => {
  const email = String(value || "").trim();
  if (!email) return DEFAULT_USER.email;
  return email;
};

const normalizeAvatar = (value) => {
  const avatar = String(value || "").trim();
  if (!avatar || avatar === LEGACY_DEFAULT_AVATAR_URL) return null;
  return avatar;
};

const normalizeUser = (user) => ({
  id: user?.id || DEFAULT_USER.id,
  name: normalizeName(user?.name),
  email: normalizeEmail(user?.email),
  role: normalizeRole(user?.role),
  avatar: normalizeAvatar(user?.avatar),
});

const readStoredSession = () => {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const token = String(parsed?.token || "").trim();
    const user = parsed?.user ? normalizeUser(parsed.user) : null;

    if (!token || !user) {
      return null;
    }

    return { token, user };
  } catch {
    return null;
  }
};

const persistSession = ({ token, user }) => {
  window.localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      token: String(token || "").trim(),
      user: normalizeUser(user),
    })
  );
};

export const clearAuthSession = () => {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const readStoredUser = () => {
  const session = readStoredSession();
  return session?.user || null;
};

export const readStoredToken = () => {
  const session = readStoredSession();
  return session?.token || null;
};

export const persistUser = (user) => {
  const session = readStoredSession();
  if (!session?.token) return;

  persistSession({
    token: session.token,
    user: normalizeUser(user),
  });
};

export const fetchCurrentUser = async () => {
  const token = readStoredToken();
  if (!token) return null;

  try {
    const response = await fetchMeRequest(token);
    const user = normalizeUser(response?.user);
    persistSession({ token, user });
    return user;
  } catch {
    clearAuthSession();
    return null;
  }
};

export const loginWithEmail = async ({ email, password }) => {
  const response = await loginRequest({ email, password });
  const user = normalizeUser(response?.user);
  const token = String(response?.token || "").trim();

  if (!token) {
    throw new Error("Login succeeded but no session token was returned.");
  }

  persistSession({ token, user });
  return user;
};

export const signupWithEmail = async ({ name, email, password, role }) => {
  const response = await signupRequest({ name, email, password, role });
  const user = normalizeUser(response?.user);
  const token = String(response?.token || "").trim();

  if (!token) {
    throw new Error("Signup succeeded but no session token was returned.");
  }

  persistSession({ token, user });
  return user;
};

export const updateProfileForCurrentUser = async ({ name, email }) => {
  const token = readStoredToken();
  if (!token) {
    throw new Error("You are not signed in.");
  }

  const response = await updateProfileRequest({ token, name, email });
  const user = normalizeUser(response?.user);
  persistSession({ token, user });
  return user;
};

export const updateAvatarForCurrentUser = async (avatar) => {
  const token = readStoredToken();
  if (!token) {
    throw new Error("You are not signed in.");
  }

  const response = await updateAvatarRequest({ token, avatar });
  const user = normalizeUser(response?.user);
  persistSession({ token, user });
  return user;
};

export const removeAvatarForCurrentUser = async () => {
  const token = readStoredToken();
  if (!token) {
    throw new Error("You are not signed in.");
  }

  const response = await removeAvatarRequest(token);
  const user = normalizeUser(response?.user);
  persistSession({ token, user });
  return user;
};

export const logoutUser = () => {
  clearAuthSession();
};

export const getDefaultUser = () => normalizeUser(DEFAULT_USER);
