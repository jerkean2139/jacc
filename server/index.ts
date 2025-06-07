import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from public directory
app.use(express.static('public'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Initialize vendor intelligence database with real payment processor data
  try {
    const { seedVendorDatabase } = await import('../setup-vendor-database');
    await seedVendorDatabase();
    console.log("✅ Vendor intelligence database initialized with authentic payment processor data");
  } catch (error) {
    console.log("ℹ️ Vendor database initialization will occur after schema migration");
  }

  // Initialize memory optimizer for production deployment
  try {
    const { memoryOptimizer } = await import('./memory-optimizer');
    memoryOptimizer.initialize();
    memoryOptimizer.optimizeForProduction();
    console.log("✅ Memory optimizer initialized for production deployment");
  } catch (error) {
    console.log("⚠️ Memory optimizer initialization failed:", error);
  }

  // Initialize knowledge base manager for automated maintenance
  try {
    const { knowledgeBaseManager } = await import('./knowledge-base-manager');
    knowledgeBaseManager.initialize();
    console.log("✅ Knowledge base manager initialized with automated maintenance");
  } catch (error) {
    console.log("⚠️ Knowledge base manager initialization failed:", error);
  }

  // Initialize multi-tenant architecture
  try {
    const { multiTenantManager } = await import('./multi-tenant-manager');
    console.log("✅ Multi-tenant architecture initialized for enterprise deployment");
  } catch (error) {
    console.log("⚠️ Multi-tenant manager initialization failed:", error);
  }

  // Initialize TracerPay documentation
  try {
    const { tracerPayProcessor } = await import('./tracerpay-processor');
    await tracerPayProcessor.processTracerPayUploads();
    console.log("✅ TracerPay documentation folder created with sales materials");
  } catch (error) {
    console.log("ℹ️ TracerPay documentation will be processed after schema migration");
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
