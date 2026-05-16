import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, typ: "access" },
    env.auth.accessSecret,
    { algorithm: "HS256", expiresIn: env.auth.accessTokenTtl }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, typ: "refresh" },
    env.auth.refreshSecret,
    { algorithm: "HS256", expiresIn: env.auth.refreshTokenTtl }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.auth.accessSecret, { algorithms: ["HS256"] });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.auth.refreshSecret, { algorithms: ["HS256"] });
}
