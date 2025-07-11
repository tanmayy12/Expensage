import { Router } from "express";
import prisma from "../prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// JWT helper
function signToken(user: { id: string, email: string }) {
  return jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

// Email/password register
router.post("/register", asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password required" });
  // Password strength: at least one letter, one number, one symbol, min 8 chars
  const strongPassword = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
  if (!strongPassword.test(password)) {
    return res.status(400).json({ error: "Password must be at least 8 characters and include at least one letter, one number, and one symbol." });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: "Email already in use" });
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, password: hash } });
  res.json({ id: user.id, name: user.name, email: user.email });
}));

// Email/password login
// Only users who have registered (signed up) can log in with email/password
router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log(`[LOGIN ATTEMPT] Email: ${email}`);
  if (!email || !password) {
    console.log(`[LOGIN FAIL] Missing email or password`);
    return res.status(400).json({ error: "Email and password required" });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`[LOGIN FAIL] User not found: ${email}`);
    return res.status(400).json({ error: "Invalid credentials" });
  }
  if (!user.password) {
    console.log(`[LOGIN FAIL] No password set for user: ${email}`);
    return res.status(400).json({ error: "Invalid credentials" });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    console.log(`[LOGIN FAIL] Invalid password for user: ${email}`);
    return res.status(400).json({ error: "Invalid credentials" });
  }
  const token = signToken({ id: user.id, email: user.email });
  console.log(`[LOGIN SUCCESS] User: ${email} (ID: ${user.id})`);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
}));


export default router; 