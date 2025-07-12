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
  "http://localhost:3000",
  "http://localhost:5173",
  "https://expensage.netlify.app",
  "https://www.expensage.netlify.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
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