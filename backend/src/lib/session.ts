import crypto from "node:crypto";

export function generateSessionId() {
  return crypto.randomBytes(32).toString("hex");
}
