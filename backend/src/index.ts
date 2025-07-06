import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import passport from "passport";
import authRoutes from "./routes/auth";
import transactionsRoutes from "./routes/transactions";
import budgetsRoutes from "./routes/budgets";
import subscriptionsRoutes from "./routes/subscriptions";
import groupsRoutes from "./routes/groups";

const app = express();
app.use(cors({ origin: "http://localhost:8080", credentials: true }));
app.use(express.json());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/budgets", budgetsRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);
app.use("/api/groups", groupsRoutes);

app.get("/", (req, res) => {
  res.send("API running!");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 