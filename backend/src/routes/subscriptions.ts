import { Router } from "express";
import prisma from "../prisma/client";
import { asyncHandler, authenticateJWT } from "../utils/asyncHandler";

const router = Router();

// Get all subscriptions for the logged-in user
router.get("/", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const subscriptions = await prisma.subscription.findMany({ where: { userId } });
  res.json(subscriptions);
}));

// Create a new subscription
router.post("/", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const { name, amount, frequency, nextPayment, category, status, icon } = req.body;
  const subscription = await prisma.subscription.create({
    data: {
      name,
      amount,
      frequency,
      nextPayment: new Date(nextPayment),
      category: category ?? 'Other',
      status,
      icon: icon ?? null,
      userId
    }
  });
  res.json(subscription);
}));

// Delete a subscription
router.delete("/:id", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const { id } = req.params;
  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription || subscription.userId !== userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await prisma.subscription.delete({ where: { id } });
  res.json({ success: true });
}));

export default router; 