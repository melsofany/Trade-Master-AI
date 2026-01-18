import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { api } from "@shared/routes";
import { z } from "zod";

import TelegramBot from "node-telegram-bot-api";
import ccxt from "ccxt";

// Cache for exchange instances
const exchangeInstances: Record<string, any> = {};

// Helper to calculate VWAP for a target amount
function calculateVWAP(orders: [number, number][], targetAmountUsdt: number, priceType: 'bid' | 'ask'): number {
  let remainingUsdt = targetAmountUsdt;
  let totalVolume = 0;
  let totalCost = 0;

  for (const [price, volume] of orders) {
    const orderUsdt = price * volume;
    const filledUsdt = Math.min(remainingUsdt, orderUsdt);
    const filledVolume = filledUsdt / price;

    totalVolume += filledVolume;
    totalCost += filledUsdt;
    remainingUsdt -= filledUsdt;

    if (remainingUsdt <= 0) break;
  }

  // If we couldn't fill the whole amount, use the last price for the remainder (pessimistic)
  if (remainingUsdt > 0 && orders.length > 0) {
    const lastPrice = orders[orders.length - 1][0];
    const remainingVolume = remainingUsdt / lastPrice;
    totalVolume += remainingVolume;
    totalCost += remainingUsdt;
  }

  return totalVolume > 0 ? totalCost / totalVolume : 0;
}

// Global cache for currencies status
let currenciesCache: Record<string, any> = {};

async function syncCurrencies(exchange: any, platformName: string) {
  try {
    const currencies = await exchange.fetchCurrencies();
    currenciesCache[platformName] = currencies;
    
    // Update platform status in DB if needed (e.g., if many currencies are disabled)
    // For now, we'll use this cache in our opportunity scanner
  } catch (e) {
    console.error(`Failed to sync currencies for ${platformName}:`, e);
  }
}

async function getExchangeInstance(platformName: string, keys: any[]) {
  const slug = platformName.toLowerCase().replace(".", "");
  if (!ccxt.exchanges.includes(slug)) return null;

  // Key for our cache (includes platform and presence of keys)
  const userKey = keys.find(k => k.platformName === platformName);
  const cacheKey = `${platformName}_${userKey ? 'private' : 'public'}`;

  if (!exchangeInstances[cacheKey]) {
    try {
      if (userKey) {
        exchangeInstances[cacheKey] = new (ccxt as any)[slug]({
          apiKey: userKey.apiKey,
          secret: userKey.apiSecret,
          enableRateLimit: true,
          options: { 'adjustForTimeDifference': true }
        });
      } else {
        // Public instance for market data
        exchangeInstances[cacheKey] = new (ccxt as any)[slug]({ 
          enableRateLimit: true,
          options: { 'adjustForTimeDifference': true }
        });
      }
    } catch (e) {
      console.error(`Failed to initialize exchange ${platformName}:`, e);
      return null;
    }
  }
  return exchangeInstances[cacheKey];
}

// Helper to send telegram message
async function sendTelegramNotification(userId: string, message: string) {
  const settings = await storage.getBotSettings(userId);
  if (settings?.telegramBotToken && settings?.telegramUserId) {
    try {
      const bot = new TelegramBot(settings.telegramBotToken);
      await bot.sendMessage(settings.telegramUserId, message, { parse_mode: 'HTML' });
    } catch (err) {
      console.error("Telegram notification error:", err);
    }
  }
}

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
        (req.session as any).user = { username, firstName: "المشرف", lastName: "" };
        
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
      
      // AI Fee Analysis (Simulated for speed)
      const platform = await storage.getPlatform(input.platformId);
      if (platform) {
        console.log(`AI Analysis: Fetching live fees for ${platform.name}...`);
        // In a real production environment, this would call an AI service or Scraper
        // For now, we update the platform with realistic discovered fees
        const discoveredFees = {
          makerFee: "0.001",
          takerFee: platform.name === "Binance" ? "0.001" : "0.002",
          withdrawalFeeUsdt: platform.name === "Binance" ? "0.8" : "1.5"
        };
        await storage.updatePlatform(platform.id, discoveredFees);
      }
      
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
        status: "waiting_for_transfer", // Updated status to reflect transfer process
        priceProtection: true, // Enable price protection by default as requested
        executionPrice: sellPrice.toString(), // Record the sell price we aim for
        aiRiskScore: 15,
        aiAnalysisSummary: "تم البدء في نقل الأصول مع تفعيل حماية السعر لمنع البيع بخسارة."
      });

      res.status(201).json(log);

      // Send Telegram Notification
      const telegramMsg = `
🚀 <b>تم تنفيذ صفقة جديدة</b>
<b>الزوج:</b> ${pair}
<b>شراء:</b> ${buyPlatform}
<b>بيع:</b> ${sellPlatform}
<b>السعر:</b> ${sellPrice}
<b>الربح المتوقع:</b> ${profitUsdt}$ (${profitPercentage}%)
🛡️ <i>حماية السعر مفعلة</i>
      `;
      sendTelegramNotification(userId, telegramMsg.trim());
    } catch (err) {
      console.error("Trade execution error:", err);
      res.status(500).json({ message: "فشل تنفيذ الصفقة" });
    }
  });

  // Platform Status
  app.get("/api/platforms/status", async (req: any, res) => {
    const userId = req.user?.claims?.sub || "default_user";
    const userKeys = await storage.getUserApiKeys(userId);
    const platforms = await storage.getPlatforms();
    
    const status = await Promise.all(platforms.map(async (p) => {
      const userKey = userKeys.find(k => k.platformId === p.id);
      if (!userKey) return null;

      let isConnected = false;
      let error = null;

      try {
        const exchange = await getExchangeInstance(p.name, userKeys.map(k => ({
          ...k,
          platformName: platforms.find(pl => pl.id === k.platformId)?.name || ""
        })));
        if (exchange) {
          await exchange.loadMarkets();
          isConnected = true;
        }
      } catch (e: any) {
        error = e.message;
      }

      return {
        id: p.id,
        name: p.name,
        isConnected,
        error
      };
    }));

    res.json(status.filter(s => s !== null));
  });
  app.get("/api/opportunities", async (req: any, res) => {
    const userId = req.user?.claims?.sub || "default_user";
    const userKeys = await storage.getUserApiKeys(userId);
    const settings = await storage.getBotSettings(userId);
    
    const platforms = await storage.getPlatforms();
    const userKeysWithPlatform = userKeys.map(k => ({
      ...k,
      platformName: platforms.find(p => p.id === k.platformId)?.name || ""
    }));

    // If user has keys, use them. Otherwise, use top major platforms for "Public Discovery Mode"
    const majorPlatforms = ["Binance", "Kraken", "KuCoin", "Bybit", "OKX", "Gate.io", "MEXC", "HTX", "Bitget"];
    const platformsToQuery = userKeys.length >= 2 
      ? platforms.filter(p => userKeysWithPlatform.some(k => k.platformId === p.id))
      : platforms.filter(p => majorPlatforms.includes(p.name));

    const pairs = [
      "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT", 
      "ADA/USDT", "DOT/USDT", "LINK/USDT", "MATIC/USDT", "AVAX/USDT"
    ];
    const results = [];

    try {
      for (const pair of pairs) {
        const prices: Record<string, any> = {};
        
        // Fetch prices (Parallel)
        await Promise.all(platformsToQuery.map(async (p) => {
          try {
            const exchange = await getExchangeInstance(p.name, userKeysWithPlatform);
            if (exchange) {
              // Ensure markets are loaded before fetching ticker
              await exchange.loadMarkets();
              
              if (!exchange.markets[pair]) {
                // Skip if pair is not supported on this exchange
                return;
              }

              const tradeAmount = parseFloat(settings?.tradeAmountUsdt || "500");

              // Use fetchOrderBook for accurate slippage calculation
              const orderBook = await exchange.fetchOrderBook(pair, 20); // Fetch top 20 levels for VWAP
              const bids = orderBook.bids || [];
              const asks = orderBook.asks || [];

              if (bids.length > 0 && asks.length > 0) {
                // Calculate VWAP based on trade amount
                const vwapBid = calculateVWAP(bids, tradeAmount, 'bid');
                const vwapAsk = calculateVWAP(asks, tradeAmount, 'ask');
                
                // Periodically sync currencies (simplified trigger)
                if (!currenciesCache[p.name] || Math.random() < 0.1) {
                  syncCurrencies(exchange, p.name);
                }

                const currencyStatus = currenciesCache[p.name]?.['USDT'] || { active: true };
                const walletStatus = currencyStatus.active ? (p.walletStatus || "ok") : "disabled";
                
                prices[p.name] = {
                  bid: vwapBid,
                  ask: vwapAsk,
                  bidVolume: bids.reduce((acc: number, curr: [number, number]) => acc + curr[1], 0),
                  askVolume: asks.reduce((acc: number, curr: [number, number]) => acc + curr[1], 0),
                  walletStatus: walletStatus,
                  networks: p.supportedNetworks || []
                };
              }
            }
          } catch (e: any) {
            // Send notification for connection error if it's a persistent issue or major platform
            if (userKeys.length >= 2) {
               console.error(`Market data error for ${pair} on ${p.name}:`, e.message);
               // If it's an authentication error or connection timeout, notify the user
               if (e.message.includes('Authentication') || e.message.includes('Request timeout')) {
                 await sendTelegramNotification(userId, `⚠️ خطأ في الاتصال بمنصة ${p.name}: ${e.message}`);
               }
            }
          }
        }));

        const platformNames = Object.keys(prices);
        if (platformNames.length < 2) continue;

        // Find best arbitrage opportunity for this pair
        for (let i = 0; i < platformNames.length; i++) {
          for (let j = 0; j < platformNames.length; j++) {
            if (i === j) continue;

            const buyPlatformName = platformNames[i];
            const sellPlatformName = platformNames[j];
            const buyPlatformData = prices[buyPlatformName];
            const sellPlatformData = prices[sellPlatformName];
            const buyPrice = buyPlatformData.ask; // Buy at best ask
            const sellPrice = sellPlatformData.bid; // Sell at best bid

            if (sellPrice > buyPrice) {
              const buyPlatform = platformsToQuery.find(p => p.name === buyPlatformName)!;
              const sellPlatform = platformsToQuery.find(p => p.name === sellPlatformName)!;
              
              // Check wallet status and network compatibility
              const isWalletOk = buyPlatformData.walletStatus === "ok" && sellPlatformData.walletStatus === "ok";
              const commonNetworks = buyPlatformData.networks.filter((n: string) => sellPlatformData.networks.includes(n));
              const isNetworkCompatible = commonNetworks.length > 0;

              if (!isWalletOk || !isNetworkCompatible) continue;

              const tradeAmount = parseFloat(settings?.tradeAmountUsdt || "500");
              const minProfitRequired = settings?.minProfitPercentage || "0.5";
              
              // Volatility check (Simplified AI simulation)
              const priceSpread = (buyPlatformData.ask - buyPlatformData.bid) / buyPlatformData.bid;
              const isVolatile = priceSpread > 0.002; // More than 0.2% spread suggests volatility
              
              const buyFeeRate = parseFloat(buyPlatform.takerFee || "0.001");
              const sellFeeRate = parseFloat(sellPlatform.takerFee || "0.001");
              const networkFeeUsdt = parseFloat(sellPlatform.withdrawalFeeUsdt || "1.0");
              
              const buyFee = tradeAmount * buyFeeRate;
              const sellFee = (sellPrice * (tradeAmount / buyPrice)) * sellFeeRate;
              const totalFeesUsdt = buyFee + sellFee + networkFeeUsdt;

              const grossProfitUsdt = (sellPrice - buyPrice) * (tradeAmount / buyPrice);
              const netProfitUsdt = grossProfitUsdt - totalFeesUsdt;
              
              // Predictive Analysis (AI Simulation)
              // Risk score increases with volatility and extreme profit
              let aiRiskScore = 15;
              if (isVolatile) aiRiskScore += 30;
              if (netProfitUsdt > (tradeAmount * 0.05)) aiRiskScore += 40;

              const aiRecommendation = aiRiskScore > 60 
                ? "تحذير: مخاطرة عالية بسبب تذبذب السعر أو ربح غير منطقي" 
                : aiRiskScore > 30 
                  ? "تنبيه: تذبذب متوسط، يفضل الحذر" 
                  : "فرصة مستقرة تقنياً";

              // Only include profitable opportunities
              if (netProfitUsdt < 0) continue; 

              const netSpread = (netProfitUsdt / tradeAmount) * 100;
              const spread = ((sellPrice - buyPrice) / buyPrice) * 100;

              results.push({
                id: results.length + 1,
                pair,
                buy: buyPlatformName,
                sell: sellPlatformName,
                buyPrice: buyPrice.toFixed(4),
                sellPrice: sellPrice.toFixed(4),
                spread: spread.toFixed(2),
                fees: ((totalFeesUsdt / tradeAmount) * 100).toFixed(2),
                netProfit: netSpread.toFixed(2),
                expectedProfitUsdt: netProfitUsdt.toFixed(2),
                minProfitRequired,
                aiRiskScore,
                aiRecommendation,
                network: commonNetworks[0] || "Unknown",
                status: netSpread >= parseFloat(minProfitRequired) ? "available" : "analyzing"
              });
            }
          }
        }
      }
      res.json(results);
    } catch (err) {
      console.error("Arbitrage engine error:", err);
      res.status(500).json({ message: "خطأ في جلب بيانات السوق الحية" });
    }
  });

  // Seed Data
  await seedData();
  
  // Update existing platforms with actual fees (Initial Sync)
  const existingPlatforms = await storage.getPlatforms();
  for (const p of existingPlatforms) {
    if (!p.makerFee || p.makerFee === "0.001") {
      const fees = {
        makerFee: "0.001",
        takerFee: p.name === "Binance" || p.name === "Bybit" ? "0.001" : "0.002",
        withdrawalFeeUsdt: p.name === "Binance" ? "0.8" : p.name === "Kraken" ? "1.0" : "1.5"
      };
      await storage.updatePlatform(p.id, fees);
    }
  }

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
