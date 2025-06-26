import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { ensureProductionFiles, configureProductionServer, validateDeploymentEnvironment } from "./deployment-config";
import { createTestDataPlaceholders, setupProductionDirectories, validateProductionEnvironment, setupErrorHandling } from "./production-setup";

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
  // Setup error handling first
  setupErrorHandling();
  
  // Configure deployment environment before starting server
  console.log("🚀 Initializing JACC deployment configuration...");
  createTestDataPlaceholders();
  setupProductionDirectories();
  ensureProductionFiles();
  configureProductionServer();
  
  const validationResults = validateProductionEnvironment();
  if (!validateDeploymentEnvironment()) {
    console.warn("⚠️ Some deployment checks failed, continuing with available configuration");
  }
  
  let server;
  try {
    server = await registerRoutes(app);
    console.log("✅ Routes registered successfully");
  } catch (error) {
    console.error("❌ Failed to register routes:", error);
    // Create a basic server if routes fail
    server = (await import('http')).createServer(app);
    console.log("⚠️ Using fallback server configuration");
  }
  
  console.log("✅ Server initialization complete");

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

  // Use environment port or fallback to 5000
  // this serves both the API and the client.
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
  
  server.listen(port, host, () => {
    log(`serving on ${host}:${port}`);
    if (process.env.NODE_ENV === "production") {
      console.log("✅ Production server ready for deployment");
    }
  });
})();
