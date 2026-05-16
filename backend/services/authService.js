import bcrypt from "bcryptjs";
import * as rdsModel from "../models/rdsModel.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";

const HASH_ROUNDS = 12;
const PASSWORD_RULE_MESSAGE =
  "Password must be atleast 8 characters long with atleast 1 uppercase letter, 1 lowercase letter, 1 digit, 1 symbol and no spaces.";

export function sanitizeUser(user) {
  // dropped password_hash and any other sensitive fields
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    contact_info: user.contact_info,
    role: user.role,
  };
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getPasswordValidationError(password) {
  const isValid =
    password.length >= 8 &&         // atleast 8 characters
    !/\s/.test(password) &&         // no spaces allowed
    /[a-z]/.test(password) &&       // atleast 1 lowercase letter
    /[A-Z]/.test(password) &&       // atleast 1 uppercase letter
    /\d/.test(password) &&          // atleast 1 digit
    /[^A-Za-z0-9]/.test(password);  //atleast 1 symbol

  return isValid ? null : PASSWORD_RULE_MESSAGE;
}

export function issueTokens(user) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  };
}

export function hashPassword(password) {
  return bcrypt.hash(password, HASH_ROUNDS);
}

function isBcryptHash(value) {
  return /^\$2[aby]\$\d{2}\$/.test(value || "");
}

export async function verifyPassword(user, password) {
  if (isBcryptHash(user.password_hash)) {
    return bcrypt.compare(password, user.password_hash);
  }

  // for backwards compatibility, updating the old plaintext passwords to hashed passwords
  const matchesPlaintext = password === user.password_hash;
  if (matchesPlaintext) {
    const passwordHash = await hashPassword(password);
    await rdsModel.updateUserPasswordHash(user.id, passwordHash);
  }

  return matchesPlaintext;
}
