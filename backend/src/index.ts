import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import transactionsRoutes from "./routes/transactions";
import budgetsRoutes from "./routes/budgets";
import subscriptionsRoutes from "./routes/subscriptions";
import groupsRoutes from "./routes/groups";
import prisma from "./prisma/client";

const app = express();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

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
  res.json({ message: "API running!", status: "healthy" });
});

// Database health check endpoint
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      message: "API and database running!", 
      status: "healthy",
      database: "connected"
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({ 
      message: "API running but database connection failed", 
      status: "unhealthy",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown database error"
    });
  }
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/budgets", budgetsRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);
app.use("/api/groups", groupsRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });
  
  // Return proper JSON error response
  res.status(500).json({ 
    error: "Internal server error", 
    message: err.message || "Something went wrong",
    timestamp: new Date().toISOString()
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found", 
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 