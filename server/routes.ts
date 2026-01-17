import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app);

  // === API Routes ===

  // Platforms (Public)
  app.get(api.platforms.list.path, async (_req, res) => {
    const platforms = await storage.getPlatforms();
    res.json(platforms);
  });

  // Settings (Protected)
  app.get(api.settings.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const settings = await storage.getBotSettings(userId);
    if (!settings) {
      // Return default if not found
      return res.json({
        userId,
        isActive: false,
        riskLevel: "medium",
        minProfitPercentage: "0.8",
        tradeAmountUsdt: "100",
        refreshRateSec: 10
      });
    }
    res.json(settings);
  });

  app.post(api.settings.update.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    try {
      const input = api.settings.update.input.parse(req.body);
      // Ensure userId matches auth
      const settings = await storage.upsertBotSettings({
        ...input,
        userId,
        riskLevel: input.riskLevel || "medium", // Provide default if missing
      } as any);
      res.json(settings);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  });

  // Keys (Protected)
  app.get(api.keys.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const keys = await storage.getUserApiKeys(userId);
    
    // Join with platform names
    const platforms = await storage.getPlatforms();
    const result = keys.map(k => ({
      id: k.id,
      platformId: k.platformId,
      platformName: platforms.find(p => p.id === k.platformId)?.name || "Unknown",
      label: k.label,
      createdAt: k.createdAt?.toISOString()
    }));
    
    res.json(result);
  });

  app.post(api.keys.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    try {
      const input = api.keys.create.input.parse(req.body);
      if (input.userId !== userId) { // Security check
         return res.status(403).json({ message: "Invalid User ID" });
      }
      const key = await storage.createUserApiKey(input);
      res.status(201).json({ id: key.id });
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  });

  app.delete(api.keys.delete.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const id = parseInt(req.params.id);
    await storage.deleteUserApiKey(id, userId);
    res.status(204).send();
  });

  // Logs (Protected)
  app.get(api.logs.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const logs = await storage.getTradeLogs(userId);
    res.json(logs);
  });

  // Dashboard Stats (Protected)
  app.get(api.dashboard.stats.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const stats = await storage.getDashboardStats(userId);
    const settings = await storage.getBotSettings(userId);
    
    res.json({
      totalProfit: stats.totalProfit.toFixed(2),
      activeBots: settings?.isActive ? 1 : 0,
      riskScore: settings?.riskLevel === "low" ? 10 : settings?.riskLevel === "high" ? 85 : 45,
      tradesToday: stats.tradesToday
    });
  });

  // Seed Data
  await seedData();

  return httpServer;
}

async function seedData() {
  const platforms = await storage.getPlatforms();
  if (platforms.length === 0) {
    await storage.createPlatform({ name: "Binance", slug: "binance", baseUrl: "https://api.binance.com" });
    await storage.createPlatform({ name: "Bybit", slug: "bybit", baseUrl: "https://api.bybit.com" });
    await storage.createPlatform({ name: "KuCoin", slug: "kucoin", baseUrl: "https://api.kucoin.com" });
    await storage.createPlatform({ name: "OKX", slug: "okx", baseUrl: "https://www.okx.com" });
  }
}
