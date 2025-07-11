import { Router } from "express";
import prisma from "../prisma/client";
import { asyncHandler, authenticateJWT } from "../utils/asyncHandler";
import crypto from 'crypto';

const router = Router();

// Get all groups for the logged-in user (via GroupMember)
router.get("/", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const groupMembers = await prisma.groupMember.findMany({
    where: { userId },
    include: { group: true }
  });
  const groups = groupMembers.map(gm => gm.group);
  res.json(groups);
}));

// Create a new group (and add creator as member)
router.post("/", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const { title } = req.body;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(400).json({ error: "User not found" });
  // Generate a unique invite token
  const inviteToken = crypto.randomBytes(16).toString('hex');
  const group = await prisma.group.create({
    data: {
      title,
      createdBy: user.name,
      inviteToken,
      members: {
        create: [{ userId, email: user.email }]
      }
    } as any,
    include: { members: true }
  });
  res.json(group);
}));

// Get invite link for a group
router.get("/:groupId/invite", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const { groupId } = req.params;
  // Check if user is a member
  const isMember = await prisma.groupMember.findFirst({ where: { groupId, userId } });
  if (!isMember) return res.status(403).json({ error: "Not a group member" });
  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { inviteToken: true } });
  if (!group || !group.inviteToken) return res.status(404).json({ error: "Invite link not found" });
  res.json({ inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/groups/join/${group.inviteToken}` });
}));

// Join a group via invite link
router.post("/join/:inviteToken", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const { inviteToken } = req.params;
  // Use findFirst with where: { inviteToken: { equals: inviteToken } }
  const group = await prisma.group.findFirst({ where: { inviteToken: { equals: inviteToken } } });
  if (!group) return res.status(404).json({ error: "Invalid invite link" });
  // Check if already a member
  const alreadyMember = await prisma.groupMember.findFirst({ where: { groupId: group.id, userId } });
  if (alreadyMember) return res.status(400).json({ error: "Already a member" });
  // Add to group
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(400).json({ error: "User not found" });
  const member = await prisma.groupMember.create({
    data: { groupId: group.id, userId, email: user.email }
  });
  res.json({ success: true, groupId: group.id });
}));

// Add a member to a group (by email)
router.post("/:groupId/members", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const { groupId } = req.params;
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  // Check if group exists and user is a member
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return res.status(404).json({ error: "Group not found" });
  const isMember = await prisma.groupMember.findFirst({ where: { groupId, userId } });
  if (!isMember) return res.status(403).json({ error: "Not a group member" });

  // Find or create user by email
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Optionally: send invite email here
    user = await prisma.user.create({ data: { email, name: email.split("@")[0] } });
  }

  // Check if already a member
  const alreadyMember = await prisma.groupMember.findFirst({ where: { groupId, userId: user.id } });
  if (alreadyMember) return res.status(400).json({ error: "User already a member" });

  // Add to group
  const member = await prisma.groupMember.create({
    data: { groupId, userId: user.id, email: user.email }
  });
  res.json(member);
}));

// List group members
router.get("/:groupId/members", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const { groupId } = req.params;
  // Check if user is a member
  const isMember = await prisma.groupMember.findFirst({ where: { groupId, userId } });
  if (!isMember) return res.status(403).json({ error: "Not a group member" });
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: { user: { select: { id: true, name: true, email: true } } }
  });
  res.json(members.map(m => ({ id: m.user.id, name: m.user.name, email: m.user.email, joinedAt: m.joinedAt })));
}));

// Leave group (remove self)
router.delete("/:groupId/leave", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const { groupId } = req.params;
  // Check membership
  const membership = await prisma.groupMember.findFirst({ where: { groupId, userId } });
  if (!membership) return res.status(404).json({ error: "Not a group member" });
  await prisma.groupMember.deleteMany({ where: { groupId, userId } });
  return res.json({ success: true });
}));

// Remove a member from a group
router.delete("/:groupId/members/:memberId", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const { groupId, memberId } = req.params;
  // Only allow if requester is a member
  const isMember = await prisma.groupMember.findFirst({ where: { groupId, userId } });
  if (!isMember) return res.status(403).json({ error: "Not a group member" });
  // Don't allow removing self (optional: allow leaving group)
  if (userId === memberId) return res.status(400).json({ error: "Use leave group to remove yourself" });
  // Remove member
  await prisma.groupMember.deleteMany({ where: { groupId, userId: memberId } });
  res.json({ success: true });
}));

// Add an expense to a group (split equally or unequally)
router.post("/:groupId/expenses", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const { groupId } = req.params;
  const { description, amount, category, paidBy, splits } = req.body;
  // splits: [{ userId, amount }], if not provided, split equally
  if (!description || !amount || !category || !paidBy) return res.status(400).json({ error: "Missing fields" });
  // Check if user is a member
  const isMember = await prisma.groupMember.findFirst({ where: { groupId, userId } });
  if (!isMember) return res.status(403).json({ error: "Not a group member" });
  // Get all group members
  const members = await prisma.groupMember.findMany({ where: { groupId } });
  type Split = { userId: string; amount: number };
  let shares: Split[] = splits;
  if (!shares || !Array.isArray(shares) || shares.length === 0) {
    // Split equally
    const perPerson = parseFloat((amount / members.length).toFixed(2));
    shares = members.map(m => ({ userId: m.userId, amount: perPerson }));
    // Adjust last share for rounding
    const total = shares.reduce((sum: number, s: Split) => sum + s.amount, 0);
    if (total !== amount) {
      shares[shares.length - 1].amount += amount - total;
    }
  }
  // Create expense and shares
  const expense = await prisma.groupExpense.create({
    data: {
      groupId,
      description,
      amount,
      category,
      paidBy,
      shares: {
        create: shares.map((s: Split) => ({ userId: s.userId, amount: s.amount }))
      }
    },
    include: { shares: true }
  });
  res.json(expense);
}));

// List group expenses
router.get("/:groupId/expenses", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const { groupId } = req.params;
  // Check if user is a member
  const isMember = await prisma.groupMember.findFirst({ where: { groupId, userId } });
  if (!isMember) return res.status(403).json({ error: "Not a group member" });
  const expenses = await prisma.groupExpense.findMany({
    where: { groupId },
    include: {
      shares: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
    orderBy: { createdAt: "desc" }
  });
  res.json(expenses);
}));

// Calculate group balances (who owes what)
router.get("/:groupId/balances", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const { groupId } = req.params;
  // Check if user is a member
  const isMember = await prisma.groupMember.findFirst({ where: { groupId, userId } });
  if (!isMember) return res.status(403).json({ error: "Not a group member" });
  // Get all members
  const members = await prisma.groupMember.findMany({ where: { groupId }, include: { user: true } });
  // Get all expenses
  const expenses = await prisma.groupExpense.findMany({ where: { groupId }, include: { shares: true } });
  // Get all settlements
  const settlements = await prisma.settlement.findMany({ where: { groupId } });
  // Calculate net owed for each member
  type Balance = { user: any; net: number };
  const balances: Record<string, Balance> = {};
  members.forEach(m => { balances[m.userId] = { user: m.user, net: 0 }; });
  // For each expense, add (share - paid) to each user
  expenses.forEach(exp => {
    exp.shares.forEach((share: { userId: string; amount: number }) => {
      balances[share.userId].net -= share.amount;
    });
    if (balances[exp.paidBy]) {
      balances[exp.paidBy].net += exp.amount;
    }
  });
  // Apply settlements
  settlements.forEach((s: { fromUserId: string; toUserId: string; amount: number }) => {
    if (balances[s.fromUserId]) balances[s.fromUserId].net += s.amount;
    if (balances[s.toUserId]) balances[s.toUserId].net -= s.amount;
  });
  // Prepare result: who owes whom
  // (Simple version: just show net balances)
  res.json(Object.values(balances));
}));

// Settle up (record a payment)
router.post("/:groupId/settle", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const { groupId } = req.params;
  const { toUserId, amount, method, upiLink } = req.body;
  if (!toUserId || !amount || !method) return res.status(400).json({ error: "Missing fields" });
  // Check if both users are members
  const fromMember = await prisma.groupMember.findFirst({ where: { groupId, userId } });
  const toMember = await prisma.groupMember.findFirst({ where: { groupId, userId: toUserId } });
  if (!fromMember || !toMember) return res.status(403).json({ error: "Both users must be group members" });
  // Record settlement
  const settlement = await prisma.settlement.create({
    data: { groupId, fromUserId: userId, toUserId, amount, method, upiLink }
  });
  res.json(settlement);
}));

// Group analytics & recent activity
router.get("/:groupId/analytics", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const { groupId } = req.params;
  // Check if user is a member
  const isMember = await prisma.groupMember.findFirst({ where: { groupId, userId } });
  if (!isMember) return res.status(403).json({ error: "Not a group member" });
  // Get expenses and settlements (last 10)
  const expenses = await prisma.groupExpense.findMany({
    where: { groupId },
    orderBy: { createdAt: "desc" },
    take: 10
  });
  const settlements = await prisma.settlement.findMany({
    where: { groupId },
    orderBy: { createdAt: "desc" },
    take: 10
  });
  // Total spent
  const totalSpent = await prisma.groupExpense.aggregate({
    where: { groupId },
    _sum: { amount: true }
  });
  // Per-category breakdown
  const categoryBreakdown = await prisma.groupExpense.groupBy({
    by: ["category"],
    where: { groupId },
    _sum: { amount: true }
  });
  res.json({
    recentExpenses: expenses,
    recentSettlements: settlements,
    totalSpent: totalSpent._sum.amount || 0,
    categoryBreakdown
  });
}));

// Delete a group (only if user is a member)
router.delete("/:id", authenticateJWT, asyncHandler(async (req, res) => {
  // @ts-ignore
  const userId = req.user.userId;
  const { id } = req.params;
  // fetch group and ensure requester is creator
  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }
  // @ts-ignore
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }
  if (group.createdBy !== user.name) {
    return res.status(403).json({ error: "Only the group creator can delete this group" });
  }
  // Delete all related records before deleting the group
  await prisma.$transaction([
    prisma.groupExpenseShare.deleteMany({
      where: {
        expense: {
          groupId: id
        }
      }
    }),
    prisma.groupExpense.deleteMany({ where: { groupId: id } }),
    prisma.settlement.deleteMany({ where: { groupId: id } }),
    prisma.groupMember.deleteMany({ where: { groupId: id } }),
    prisma.group.delete({ where: { id } })
  ]);
  res.json({ success: true });
}));

export default router; 