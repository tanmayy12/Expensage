import { Router } from "express";
import prisma from "../prisma/client";
import { asyncHandler, authenticateJWT } from "../utils/asyncHandler";

const router = Router();

// Get all transactions for the logged-in user
router.get("/", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const transactions = await prisma.transaction.findMany({ where: { userId }, orderBy: { date: "desc" } });
  res.json(transactions);
}));

// Create a new transaction
router.post("/", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const { type, amount, category, description, date } = req.body;
  const transaction = await prisma.transaction.create({
    data: { type, amount, category, description, date: new Date(date), userId }
  });
  res.json(transaction);
}));

// Delete a transaction
router.delete("/:id", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const { id } = req.params;
  // Only allow delete if the transaction belongs to the user
  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction || transaction.userId !== userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await prisma.transaction.delete({ where: { id } });
  res.json({ success: true });
}));

// Update a transaction
router.put("/:id", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const { id } = req.params;
  const { type, amount, category, description, date } = req.body;
  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction || transaction.userId !== userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const updated = await prisma.transaction.update({
    where: { id },
    data: { type, amount, category, description, date: new Date(date) }
  });
  res.json(updated);
}));

export default router; 