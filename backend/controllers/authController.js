import { env } from "../config/env.js";
import { PUBLIC_REGISTRATION_ROLES, USER_ROLES } from "../constants/appConstants.js";
import * as rdsModel from "../models/rdsModel.js";
import * as authService from "../services/authService.js";
import { clearAuthCookies, readCookie, setAuthCookies } from "../utils/cookies.js";
import { verifyRefreshToken } from "../utils/jwt.js";

export async function register(req, res) {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: "Please provide all required fields." });
  }
  if (!authService.isValidEmail(email)) {
    return res.status(400).json({ success: false, message: "Please provide a valid email address." });
  }
  const passwordError = authService.getPasswordValidationError(password);
  if (passwordError) {
    return res.status(400).json({ success: false, message: passwordError });
  }
  if (!PUBLIC_REGISTRATION_ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Registration is only available for customers and vendors.",
    });
  }

  try {
    const normalizedEmail = authService.normalizeEmail(email);
    const existingRole = await rdsModel.findUserByEmail(normalizedEmail, role);
    if (existingRole) {
      return res.status(409).json({ success: false, message: "This account already has that role." });
    }

    let user = await rdsModel.findUserByEmail(normalizedEmail);
    if (user) {
      const isSameUser = await authService.verifyPassword(user, password);
      if (!isSameUser) {
        return res.status(409).json({
          success: false,
          message: "This email is already registered. Use the same password to add another role.",
        });
      }

      await rdsModel.addUserRole(user.id, role);
    } else {
      const passwordHash = await authService.hashPassword(password);
      user = await rdsModel.createUser({
        name: String(name).trim(),
        email: normalizedEmail,
        password_hash: passwordHash,
      });
      await rdsModel.addUserRole(user.id, role);
    }

    const sessionUser = { ...user, role };
    const safeUser = authService.sanitizeUser(sessionUser);
    setAuthCookies(res, authService.issueTokens(sessionUser));
    return res.status(201).json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ success: false, message: "Error during registration." });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  const { role } = req.params;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Please provide email and password." });
  }
  if (!authService.isValidEmail(email)) {
    return res.status(400).json({ success: false, message: "Please provide a valid email address." });
  }
  const passwordError = authService.getPasswordValidationError(password);
  if (passwordError) {
    return res.status(400).json({ success: false, message: passwordError });
  }
  if (!Object.values(USER_ROLES).includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid account type." });
  }

  try {
    const normalizedEmail = authService.normalizeEmail(email);
    const user = await rdsModel.findUserByEmail(normalizedEmail, role);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const isMatch = await authService.verifyPassword(user, password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const safeUser = authService.sanitizeUser(user);
    setAuthCookies(res, authService.issueTokens(user));
    return res.status(200).json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Error during login." });
  }
}

export async function refresh(req, res) {
  const refreshToken = readCookie(req, env.auth.refreshCookieName);
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: "Refresh session is required." });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded.sub || decoded.typ !== "refresh") {
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

    const sessionUser = { ...user, role: decoded.role };
    const safeUser = authService.sanitizeUser(sessionUser);
    setAuthCookies(res, authService.issueTokens(sessionUser));
    return res.status(200).json({ success: true, user: safeUser });
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired session." });
  }
}

export function logout(req, res) {
  clearAuthCookies(res);
  return res.status(200).json({ success: true, message: "Logged out successfully." });
}

export async function getMe(req, res) {
  try {
    const user = await rdsModel.findUserById(req.user.id);
    if (!user || user.is_deleted) {
      return res.status(401).json({ success: false, message: "Invalid or expired session." });
    }

    const roles = await rdsModel.getUserRoles(user.id);
    return res.status(200).json({
      success: true,
      user: authService.sanitizeUser({ ...user, role: req.user.role }),
      roles,
    });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch profile." });
  }
}

export async function updateMe(req, res) {
  const { name, contact_info } = req.body;

  if (name !== undefined && !String(name).trim()) {
    return res.status(400).json({ success: false, message: "Name cannot be empty." });
  }

  try {
    const user = await rdsModel.updateUserProfile(req.user.id, {
      name: name !== undefined ? String(name).trim() : undefined,
      contact_info: contact_info !== undefined ? String(contact_info).trim() || null : undefined,
    });

    return res.status(200).json({
      success: true,
      user: authService.sanitizeUser({ ...user, role: req.user.role }),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ success: false, message: "Failed to update profile." });
  }
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Current password and new password are required." });
  }

  const passwordError = authService.getPasswordValidationError(newPassword);
  if (passwordError) {
    return res.status(400).json({ success: false, message: passwordError });
  }

  try {
    const user = await rdsModel.findUserByEmail(req.user.email);
    if (!user || user.is_deleted) {
      return res.status(401).json({ success: false, message: "Invalid or expired session." });
    }

    const currentPasswordMatches = await authService.verifyPassword(user, currentPassword);
    if (!currentPasswordMatches) {
      return res.status(400).json({ success: false, message: "Current password is incorrect." });
    }

    const passwordHash = await authService.hashPassword(newPassword);
    await rdsModel.updateUserPasswordHash(req.user.id, passwordHash);
    return res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ success: false, message: "Failed to update password." });
  }
}

export async function deleteMe(req, res) {
  try {
    const isHighestBidder = await rdsModel.isHighestBidderOnActiveAuction(req.user.id);
    if (isHighestBidder) {
      return res.status(400).json({
        success: false,
        message: "Account cannot be deleted while you are the highest bidder on an active auction.",
      });
    }

    const hasVendorAuctions = await rdsModel.hasUnresolvedVendorAuctions(req.user.id);
    if (hasVendorAuctions) {
      return res.status(400).json({
        success: false,
        message: "Account cannot be deleted while you have unresolved vendor auctions.",
      });
    }

    await rdsModel.softDeleteUser(req.user.id);
    clearAuthCookies(res);
    return res.status(200).json({ success: true, message: "Account deleted successfully." });
  } catch (error) {
    console.error("Delete account error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete account." });
  }
}
