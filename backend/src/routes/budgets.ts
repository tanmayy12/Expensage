import { Router } from "express";
import prisma from "../prisma/client";
import { asyncHandler, authenticateJWT } from "../utils/asyncHandler";

const router = Router();

// Get all budgets for the logged-in user
router.get("/", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const budgets = await prisma.budget.findMany({ where: { userId } });
  res.json(budgets);
}));

// Create a new budget
router.post("/", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const { category, amount, period } = req.body;
  const budget = await prisma.budget.create({
    data: { category, amount, period, userId }
  });
  res.json(budget);
}));

// Delete a budget
router.delete("/:id", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const { id } = req.params;
  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget || budget.userId !== userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await prisma.budget.delete({ where: { id } });
  res.json({ success: true });
}));

// Update a budget
router.put("/:id", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const { id } = req.params;
  const { amount, period } = req.body;
  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget || budget.userId !== userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const updated = await prisma.budget.update({
    where: { id },
    data: { amount, period }
  });
  res.json(updated);
}));

export default router; 