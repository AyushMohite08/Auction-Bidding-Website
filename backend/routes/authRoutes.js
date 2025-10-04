import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as rdsModel from "../models/rdsModel.js";
import { pool } from "../models/rdsModel.js";

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

    // Create user with plain password
    const newUser = await rdsModel.createUser({
      name,
      email,
      password_hash: password, // Storing plain password
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

  console.log('Login attempt:', { email, role }); // Debug log

  try {
    // Validate input
    if (!email || !password) {
      console.log('Missing credentials'); // Debug log
      return res.status(400).json({ 
        success: false,
        message: "Please provide email and password" 
      });
    }

    // Find user
    console.log('Finding user with email and role:', { email, role }); // Debug log
    const user = await rdsModel.findUserByEmail(email, role);
    console.log('User found:', user ? 'Yes' : 'No'); // Debug log
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Simple password comparison
    const isMatch = (password === user.password);
    console.log('Checking password:', password);
    console.log('Stored password:', user.password);
    
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
    console.error("Error stack:", error.stack); // Adding stack trace
    res.status(500).json({ 
      success: false,
      message: "Error during login",
      debug: error.message // Adding error message for debugging
    });
  }
});
router.get("/debug/db", async (req, res) => {
  if (!pool) {
    return res.status(500).json({
      success: false,
      error: "MySQL pool is not initialized. Check .env and DB connectivity."
    });
  }

  try {
    const [rows] = await pool.execute("SELECT 1 + 1 AS result");
    res.json({ success: true, result: rows[0] });
  } catch (err) {
    console.error("DB debug error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Unknown error",
      stack: err.stack || "No stack trace"
    });
  }
});

export default router;