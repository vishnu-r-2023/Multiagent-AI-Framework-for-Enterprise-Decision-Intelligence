import crypto from "crypto";

const TOKEN_ALGORITHM = "HS256";

const base64UrlEncode = (value) => Buffer.from(value).toString("base64url");
const base64UrlDecode = (value) => Buffer.from(value, "base64url").toString("utf8");

const sign = (value, secret) => crypto.createHmac("sha256", secret).update(value).digest("base64url");

export function createAuthToken(payload, secret, expiresInSeconds = 7 * 24 * 60 * 60) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: TOKEN_ALGORITHM, typ: "JWT" }));
  const body = base64UrlEncode(
    JSON.stringify({
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
    })
  );
  const unsigned = `${header}.${body}`;
  const signature = sign(unsigned, secret);
  return `${unsigned}.${signature}`;
}

export function verifyAuthToken(token, secret) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format.");
  }

  const [header, payload, signature] = parts;
  const unsigned = `${header}.${payload}`;
  const expectedSignature = sign(unsigned, secret);

  const left = Buffer.from(signature);
  const right = Buffer.from(expectedSignature);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    throw new Error("Invalid token signature.");
  }

  const decodedPayload = JSON.parse(base64UrlDecode(payload));
  const now = Math.floor(Date.now() / 1000);

  if (!decodedPayload.exp || now >= decodedPayload.exp) {
    throw new Error("Token expired.");
  }

  return decodedPayload;
}
