import crypto from "crypto";

const SCRYPT_KEY_LENGTH = 64;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;

  const [salt, knownDerivedKey] = storedHash.split(":");
  if (!salt || !knownDerivedKey) return false;

  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  const left = Buffer.from(derivedKey, "hex");
  const right = Buffer.from(knownDerivedKey, "hex");

  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}
