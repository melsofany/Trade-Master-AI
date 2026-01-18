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

  // === Authentication Routes ===
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;

    if (username === adminUser && password === adminPass) {
      // Clear existing session data
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ message: "خطأ في إنشاء الجلسة" });
        }

        (req.session as any).isAuthenticated = true;
        (req.session as any).user = { username: adminUser, firstName: "Admin", lastName: "" };
        
        // Manual session assignment for bypass
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ message: "خطأ في حفظ الجلسة" });
          }
          res.json({ success: true });
        });
      });
    } else {
      res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    }
  });

  app.get("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/login");
    });
  });

  app.get("/api/auth/user", (req, res) => {
    // Check both session and passport
    if ((req.session as any).isAuthenticated || req.isAuthenticated()) {
      const user = (req.session as any).user || req.user;
      res.json(user);
    } else {
      res.status(401).json({ message: "غير مصرح" });
    }
  });

  // Middleware to protect routes
  const requireAuth = (req: any, res: any, next: any) => {
    if ((req.session as any).isAuthenticated || req.isAuthenticated()) {
      next();
    } else {
      res.status(401).json({ message: "يرجى تسجيل الدخول أولاً" });
    }
  };

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

  // AI Models
  app.get("/api/ai-models", async (req: any, res) => {
    const userId = req.user?.claims?.sub || "default_user";
    const models = await storage.getAiModels(userId);
    res.json(models);
  });

  app.post("/api/ai-models", async (req: any, res) => {
    const userId = req.user?.claims?.sub || "default_user";
    try {
      const model = await storage.createAiModel({ ...req.body, userId });
      res.status(201).json(model);
    } catch (err) {
      res.status(400).json({ message: "Failed to create AI model" });
    }
  });

  app.delete("/api/ai-models/:id", async (req: any, res) => {
    const userId = req.user?.claims?.sub || "default_user";
    const id = parseInt(req.params.id);
    await storage.deleteAiModel(id, userId);
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

  // Execute Trade
  app.post("/api/trades/execute", async (req: any, res) => {
    const userId = req.user?.claims?.sub || "default_user";
    const { pair, buyPlatform, sellPlatform, amount, buyPrice, sellPrice, profitUsdt, profitPercentage } = req.body;

    try {
      // In a real app, this would call the exchange APIs via CCXT
      // Here we simulate success and save to database
      const platforms = await storage.getPlatforms();
      const buyP = platforms.find(p => p.name === buyPlatform);
      const sellP = platforms.find(p => p.name === sellPlatform);

      const log = await storage.createTradeLog({
        userId,
        pair,
        buyPlatformId: buyP?.id,
        sellPlatformId: sellP?.id,
        amount: amount.toString(),
        buyPrice: buyPrice.toString(),
        sellPrice: sellPrice.toString(),
        profitUsdt: profitUsdt.toString(),
        profitPercentage: profitPercentage.toString(),
        status: "executed",
        aiRiskScore: 15,
        aiAnalysisSummary: "تم التنفيذ بنجاح بناءً على طلب المستخدم."
      });

      res.status(201).json(log);
    } catch (err) {
      console.error("Trade execution error:", err);
      res.status(500).json({ message: "فشل تنفيذ الصفقة" });
    }
  });

  // Arbitrage Opportunities
  app.get("/api/opportunities", async (req: any, res) => {
    const userId = req.user?.claims?.sub || "default_user";
    const userKeys = await storage.getUserApiKeys(userId);
    const settings = await storage.getBotSettings(userId);
    
    if (userKeys.length < 1) {
      return res.json([]); // No API keys, no actual opportunities
    }

    const platforms = await storage.getPlatforms();
    const userPlatforms = platforms.filter(p => userKeys.some(k => k.platformId === p.id));
    
    if (userPlatforms.length < 2) {
      // Need at least 2 platforms for arbitrage
      return res.json([]);
    }

    const pairs = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "XRP/USDT", "ADA/USDT"];
    
    // Simulate live data ONLY between connected platforms
    const opportunities = pairs.map((pair, index) => {
      const p1Idx = Math.floor(Math.random() * userPlatforms.length);
      let p2Idx = Math.floor(Math.random() * userPlatforms.length);
      while (p1Idx === p2Idx) p2Idx = Math.floor(Math.random() * userPlatforms.length);
      
      const basePrice = pair.startsWith("BTC") ? 95000 : pair.startsWith("ETH") ? 2500 : 150;
      const buyPrice = (basePrice * (1 - Math.random() * 0.01)).toFixed(2);
      const sellPrice = (basePrice * (1 + Math.random() * 0.01)).toFixed(2);
      const spread = (((parseFloat(sellPrice) - parseFloat(buyPrice)) / parseFloat(buyPrice)) * 100).toFixed(2);
      
      const minProfitRequired = settings?.minProfitPercentage || "0.8";
      
      // Assume standard fees: 0.1% maker/taker fee per exchange + 0.05% estimated withdrawal/network fee
      const exchangeFee = 0.001; // 0.1%
      const totalFeesPercentage = (exchangeFee * 2 + 0.0005) * 100; // Total fees in % (approx 0.25%)
      
      const netSpread = parseFloat(spread) - totalFeesPercentage;
      const isProfitable = netSpread >= parseFloat(minProfitRequired);
      
      // Calculate minimum amount required to cover fees and hit target profit
      // We need (Amount * Spread) - (Amount * Fees) >= (Amount * MinProfit)
      // This actually means Spread - Fees >= MinProfit
      // To find the actual amount needed if we want to hit a specific USDT profit target:
      const tradeAmount = parseFloat(settings?.tradeAmountUsdt || "100");
      const expectedProfitUsdt = (tradeAmount * (netSpread / 100)).toFixed(2);
      
      const minAmountRequired = (tradeAmount * (parseFloat(minProfitRequired) / Math.max(netSpread, 0.1))).toFixed(2);

      return {
        id: index + 1,
        pair,
        buy: userPlatforms[p1Idx]?.name,
        sell: userPlatforms[p2Idx]?.name,
        buyPrice,
        sellPrice,
        spread,
        fees: totalFeesPercentage.toFixed(2),
        netProfit: netSpread.toFixed(2),
        expectedProfitUsdt,
        minProfitRequired,
        minAmountRequired,
        status: isProfitable ? "available" : "analyzing"
      };
    });

    res.json(opportunities);
  });

  // Seed Data
  await seedData();

  return httpServer;
}

async function seedData() {
  const platforms = await storage.getPlatforms();
  if (platforms.length === 0) {
    const defaultPlatforms = [
      { name: "Binance", slug: "binance", baseUrl: "https://api.binance.com" },
      { name: "Bybit", slug: "bybit", baseUrl: "https://api.bybit.com" },
      { name: "KuCoin", slug: "kucoin", baseUrl: "https://api.kucoin.com" },
      { name: "OKX", slug: "okx", baseUrl: "https://www.okx.com" },
      { name: "Kraken", slug: "kraken", baseUrl: "https://api.kraken.com" },
      { name: "Gate.io", slug: "gateio", baseUrl: "https://api.gateio.ws" },
      { name: "Huobi", slug: "huobi", baseUrl: "https://api.huobi.pro" },
      { name: "MEXC", slug: "mexc", baseUrl: "https://api.mexc.com" },
      { name: "Bitget", slug: "bitget", baseUrl: "https://api.bitget.com" },
      { name: "Coinbase", slug: "coinbase", baseUrl: "https://api.coinbase.com" },
      { name: "Bitfinex", slug: "bitfinex", baseUrl: "https://api.bitfinex.com" },
      { name: "Bittrex", slug: "bittrex", baseUrl: "https://api.bittrex.com" },
      { name: "Poloniex", slug: "poloniex", baseUrl: "https://api.poloniex.com" },
      { name: "Gemini", slug: "gemini", baseUrl: "https://api.gemini.com" },
      { name: "Crypto.com", slug: "cryptocom", baseUrl: "https://api.crypto.com" },
      { name: "LBank", slug: "lbank", baseUrl: "https://api.lbank.info" },
      { name: "Phemex", slug: "phemex", baseUrl: "https://api.phemex.com" },
      { name: "Bitstamp", slug: "bitstamp", baseUrl: "https://www.bitstamp.net" },
      { name: "WhiteBIT", slug: "whitebit", baseUrl: "https://whitebit.com" },
      { name: "DigiFinex", slug: "digifinex", baseUrl: "https://openapi.digifinex.com" },
      { name: "CoinEx", slug: "coinex", baseUrl: "https://api.coinex.com" },
      { name: "AscendEX", slug: "ascendex", baseUrl: "https://ascendex.com" },
      { name: "BitMart", slug: "bitmart", baseUrl: "https://api-cloud.bitmart.com" },
      { name: "BingX", slug: "bingx", baseUrl: "https://open-api.bingx.com" },
      { name: "XT.COM", slug: "xtcom", baseUrl: "https://api.xt.com" }
    ];

    for (const p of defaultPlatforms) {
      await storage.createPlatform(p);
    }
  }
}
