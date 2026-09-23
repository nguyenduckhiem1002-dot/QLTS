import bcrypt from "bcryptjs";

const PASSWORD_ROUNDS = 12;

export function validatePassword(password: string) {
  const bytes = Buffer.byteLength(password, "utf8");

  if (password.length < 10) {
    return "too_short" as const;
  }

  if (bytes > 72) {
    return "too_long" as const;
  }

  return null;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, PASSWORD_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}
