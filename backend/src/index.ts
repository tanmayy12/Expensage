import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import transactionsRoutes from "./routes/transactions";
import budgetsRoutes from "./routes/budgets";
import subscriptionsRoutes from "./routes/subscriptions";
import groupsRoutes from "./routes/groups";

const app = express();

// CORS configuration
const allowedOrigins = [
  "http://localhost:8080",
  "https://expensage.netlify.app"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.send("API running!");
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/budgets", budgetsRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);
app.use("/api/groups", groupsRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 