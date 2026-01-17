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

  // Balances
  app.get("/api/balances", async (req: any, res) => {
    const userId = req.user?.claims?.sub || "default_user";
    const balances = await storage.getUserBalances(userId);
    res.json(balances);
  });

  // Settings (Public for bypass)
  app.get(api.settings.get.path, async (req: any, res) => {
    const userId = req.user?.claims?.sub || "default_user";
    const settings = await storage.getBotSettings(userId);
    if (!settings) {
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

  app.post(api.settings.update.path, async (req: any, res) => {
    const userId = req.user?.claims?.sub || "default_user";
    try {
      const input = api.settings.update.input.parse(req.body);
      const settings = await storage.upsertBotSettings({
        ...input,
        userId,
        riskLevel: input.riskLevel || "medium",
      } as any);
      res.json(settings);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  });

  // Keys (Public for bypass)
  app.get(api.keys.list.path, async (req: any, res) => {
    const userId = req.user?.claims?.sub || "default_user";
    const keys = await storage.getUserApiKeys(userId);
    
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

  app.post(api.keys.create.path, async (req: any, res) => {
    const userId = req.user?.claims?.sub || "default_user";
    try {
      const input = api.keys.create.input.parse(req.body);
      const key = await storage.createUserApiKey({ ...input, userId });
      res.status(201).json({ id: key.id });
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  });

  app.delete(api.keys.delete.path, async (req: any, res) => {
    const userId = req.user?.claims?.sub || "default_user";
    const id = parseInt(req.params.id);
    await storage.deleteUserApiKey(id, userId);
    res.status(204).send();
  });

  // Logs (Public for bypass)
  app.get(api.logs.list.path, async (req: any, res) => {
    const userId = req.user?.claims?.sub || "default_user";
    const logs = await storage.getTradeLogs(userId);
    res.json(logs);
  });

  // Dashboard Stats (Public for bypass)
  app.get(api.dashboard.stats.path, async (req: any, res) => {
    const userId = req.user?.claims?.sub || "default_user";
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
