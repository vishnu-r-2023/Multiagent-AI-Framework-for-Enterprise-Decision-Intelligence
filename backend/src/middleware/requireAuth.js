import { verifyAuthToken } from "../utils/authToken.js";

const getAuthSecret = () =>
  process.env.AUTH_TOKEN_SECRET || process.env.JWT_SECRET;

const getBearerToken = (authorizationHeader) => {
  const [scheme, token] = String(authorizationHeader || "").split(" ");
  if (!/^Bearer$/i.test(scheme) || !token) return null;
  return token;
};

export function requireAuth(req, res, next) {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Missing authorization token.",
    });
  }

  try {
    const payload = verifyAuthToken(token, getAuthSecret());
    const userId = String(payload?.sub || "").trim();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload.",
      });
    }

    req.auth = {
      userId,
      email: String(payload?.email || "").trim().toLowerCase(),
    };

    return next();
  } catch (_error) {
    return res.status(401).json({
      success: false,
      message: "Session is invalid or expired.",
    });
  }
}
