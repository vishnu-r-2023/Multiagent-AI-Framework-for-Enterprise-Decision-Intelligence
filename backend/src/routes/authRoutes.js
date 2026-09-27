import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { User } from "../models/User.js";
import { createAuthToken } from "../utils/authToken.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

const router = express.Router();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 6;
const NAME_MIN_LENGTH = 2;
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const MAX_AVATAR_DATA_URL_LENGTH = 7 * 1024 * 1024;
const ALLOWED_ROLES = ["Admin", "Manager", "Employee"];
const ROLE_LOOKUP = {
  admin: "Admin",
  manager: "Manager",
  employee: "Employee",
};
const LEGACY_DEFAULT_AVATAR_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCdRGOcYbQAgdQSztklApJCbUn80iyLIoDi4zu8CQvUQLtjPtGVu4ct4RGJhue4Xci7Xk0MlL_dx1I4l7krfvTmlyKiMw-o_cbOdBF1O3I_XaA5CxP6BfQyVW1s-UVN2AVlYctm9HqJxkOUfZmTsliNU0XRatPY-nCTJlZlQtl4lVfd6bRnlcv9BqY9RoknKiiWaWqj40-o9pODdpn15aCwFNDZ6RZvjwkDmjrZQWZukw6-5TwBqUerN_r9SXH-SpN18NFQPHL3048";

const normalizeAvatar = (value) => {
  const avatar = String(value || "").trim();
  if (!avatar || avatar === LEGACY_DEFAULT_AVATAR_URL) return null;
  return avatar;
};

const clearLegacyAvatarIfNeeded = async (user) => {
  if (!user) return user;
  if (String(user.avatar || "").trim() !== LEGACY_DEFAULT_AVATAR_URL) {
    return user;
  }

  user.avatar = null;
  await user.save();
  return user;
};

const toClientUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: normalizeAvatar(user.avatar),
});

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizeName = (value) => String(value || "").trim();
const normalizeRole = (value) => ROLE_LOOKUP[String(value || "").trim().toLowerCase()] || null;

const deriveDisplayName = (email) => {
  const local = email.split("@")[0] || "User";
  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getAuthSecret = () =>
  process.env.AUTH_TOKEN_SECRET || process.env.JWT_SECRET || "dev-auth-secret-change-me";

router.post("/signup", async (req, res, next) => {
  try {
    const name = normalizeName(req.body?.name);
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    const role = normalizeRole(req.body?.role || "Employee");

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    if (name.length < NAME_MIN_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Name must be at least ${NAME_MIN_LENGTH} characters.`,
      });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      });
    }

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Please choose a valid role.",
      });
    }

    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const user = await User.create({
      name: name || deriveDisplayName(email),
      email,
      role,
      avatar: null,
      passwordHash: hashPassword(password),
    });

    const token = createAuthToken({ sub: String(user._id), email }, getAuthSecret(), TOKEN_TTL_SECONDS);

    return res.status(201).json({
      success: true,
      token,
      user: toClientUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

const updateProfileHandler = async (req, res, next) => {
  try {
    const name = normalizeName(req.body?.name);
    const email = normalizeEmail(req.body?.email);

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required.",
      });
    }

    if (name.length < NAME_MIN_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Name must be at least ${NAME_MIN_LENGTH} characters.`,
      });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.auth.userId },
    }).lean();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.auth.userId,
      { name, email },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      user: toClientUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

router.patch("/profile", requireAuth, updateProfileHandler);
router.post("/profile", requireAuth, updateProfileHandler);

router.post("/login", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    await clearLegacyAvatarIfNeeded(user);

    const token = createAuthToken({ sub: String(user._id), email: user.email }, getAuthSecret(), TOKEN_TTL_SECONDS);

    return res.json({
      success: true,
      token,
      user: toClientUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await clearLegacyAvatarIfNeeded(await User.findById(req.auth.userId));
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found for this session.",
      });
    }

    return res.json({
      success: true,
      user: toClientUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/avatar", requireAuth, async (req, res, next) => {
  try {
    const avatar = normalizeAvatar(req.body?.avatar);

    if (!avatar) {
      return res.status(400).json({
        success: false,
        message: "Avatar image is required.",
      });
    }

    if (!avatar.startsWith("data:image/")) {
      return res.status(400).json({
        success: false,
        message: "Invalid avatar format. Please upload a valid image.",
      });
    }

    if (avatar.length > MAX_AVATAR_DATA_URL_LENGTH) {
      return res.status(400).json({
        success: false,
        message: "Avatar image is too large.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.auth.userId,
      { avatar },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      user: toClientUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/avatar", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.auth.userId,
      { avatar: null },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      user: toClientUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
