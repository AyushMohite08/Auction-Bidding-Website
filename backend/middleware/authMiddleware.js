import { USER_ROLES } from "../constants/appConstants.js";
import { env } from "../config/env.js";
import * as rdsModel from "../models/rdsModel.js";
import { readCookie } from "../utils/cookies.js";
import { verifyAccessToken } from "../utils/jwt.js";

export async function requireAuth(req, res, next) {
  const token = readCookie(req, env.auth.accessCookieName);
  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication is required." });
  }

  try {
    const decoded = verifyAccessToken(token);
    if (!decoded.sub || !decoded.role || decoded.typ !== "access") {
      return res.status(401).json({ success: false, message: "Invalid or expired session." });
    }

    const user = await rdsModel.findUserById(decoded.sub);
    if (!user || user.is_deleted) {
      return res.status(401).json({ success: false, message: "Invalid or expired session." });
    }
    const hasRole = await rdsModel.userHasRole(user.id, decoded.role);
    if (!hasRole) {
      return res.status(401).json({ success: false, message: "Invalid or expired session." });
    }

    req.user = { id: user.id, email: user.email, name: user.name, role: decoded.role };
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired session." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access forbidden." });
    }

    return next();
  };
}

export function requireCustomerSelfOrAdmin(paramName = "customerId") {
  return (req, res, next) => {
    const isAdmin = req.user?.role === USER_ROLES.ADMIN;
    const isMatchingCustomer = req.user?.role === USER_ROLES.CUSTOMER && req.user?.id === req.params[paramName];

    if (isAdmin || isMatchingCustomer) {
      return next();
    }

    return res.status(403).json({ success: false, message: "Forbidden: Access denied." });
  };
}
