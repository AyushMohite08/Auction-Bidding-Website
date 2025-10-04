import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as rdsModel from "../models/rdsModel.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-default-secret";

// Register endpoint
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide all required fields" 
      });
    }

    // Check if user already exists
    const existingUser = await rdsModel.findUserByEmail(email, role);
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "User already exists with this email" 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await rdsModel.createUser({
      name,
      email,
      password_hash: hashedPassword,
      role
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Return success with user info and token
    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        token
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error during registration"
    });
  }
});

// Login endpoint
router.post("/login/:role", async (req, res) => {
  const { email, password } = req.body;
  const { role } = req.params;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide email and password" 
      });
    }

    // Find user
    const user = await rdsModel.findUserByEmail(email, role);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid password" 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Return success with user info and token
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error during login" 
    });
  }
});

export default router;