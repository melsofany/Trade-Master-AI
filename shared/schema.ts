import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth"; // Import auth user table

// === Platforms (Exchanges) ===
export const platforms = pgTable("platforms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // Binance, Kraken, etc.
  slug: text("slug").notNull().unique(),
  baseUrl: text("base_url").notNull(),
  isActive: boolean("is_active").default(true),
});

// === User API Keys (Encrypted ideally, simplified for demo) ===
export const userApiKeys = pgTable("user_api_keys", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Foreign key to auth.users (varchar id)
  platformId: integer("platform_id").notNull().references(() => platforms.id),
  apiKey: text("api_key").notNull(),
  apiSecret: text("api_secret").notNull(),
  label: text("label"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === Bot Settings ===
export const botSettings = pgTable("bot_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(), // One setting per user
  isActive: boolean("is_active").default(false),
  riskLevel: text("risk_level").default("medium"), // low, medium, high
  minProfitPercentage: numeric("min_profit_percentage").default("0.8"),
  tradeAmountUsdt: numeric("trade_amount_usdt").default("100"),
  refreshRateSec: integer("refresh_rate_sec").default(10),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === Trade Logs (History) ===
export const tradeLogs = pgTable("trade_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  pair: text("pair").notNull(), // BTC/USDT
  buyPlatformId: integer("buy_platform_id").references(() => platforms.id),
  sellPlatformId: integer("sell_platform_id").references(() => platforms.id),
  amount: numeric("amount").notNull(),
  buyPrice: numeric("buy_price").notNull(),
  sellPrice: numeric("sell_price").notNull(),
  profitUsdt: numeric("profit_usdt"),
  profitPercentage: numeric("profit_percentage"),
  status: text("status").notNull(), // executed, failed, simulated
  aiRiskScore: integer("ai_risk_score"), // 0-100
  aiAnalysisSummary: text("ai_analysis_summary"),
  executedAt: timestamp("executed_at").defaultNow(),
});

// === AI Analysis Logs (Audit trail) ===
export const aiLogs = pgTable("ai_logs", {
  id: serial("id").primaryKey(),
  tradeLogId: integer("trade_log_id").references(() => tradeLogs.id),
  userId: text("user_id").notNull(),
  action: text("action").notNull(), // APPROVE, REJECT
  reasoning: text("reasoning").notNull(),
  newsSource: text("news_source"),
  marketSentiment: text("market_sentiment"), // BULLISH, BEARISH, NEUTRAL
  createdAt: timestamp("created_at").defaultNow(),
});

// === User Balances (per platform) ===
export const userBalances = pgTable("user_balances", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  platformId: integer("platform_id").notNull().references(() => platforms.id),
  asset: text("asset").notNull(), // BTC, ETH, USDT
  balance: numeric("balance").default("0"),
  valueUsdt: numeric("value_usdt").default("0"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === Zod Schemas ===
export const insertPlatformSchema = createInsertSchema(platforms);
export const insertUserApiKeySchema = createInsertSchema(userApiKeys).omit({ id: true, createdAt: true });
export const insertBotSettingsSchema = createInsertSchema(botSettings).omit({ id: true, updatedAt: true });
export const insertTradeLogSchema = createInsertSchema(tradeLogs).omit({ id: true, executedAt: true });
export const insertAiLogSchema = createInsertSchema(aiLogs).omit({ id: true, createdAt: true });
export const insertUserBalanceSchema = createInsertSchema(userBalances).omit({ id: true, updatedAt: true });

// === Types ===
export type Platform = typeof platforms.$inferSelect;
export type UserApiKey = typeof userApiKeys.$inferSelect;
export type BotSettings = typeof botSettings.$inferSelect;
export type TradeLog = typeof tradeLogs.$inferSelect;
export type AiLog = typeof aiLogs.$inferSelect;
export type UserBalance = typeof userBalances.$inferSelect;

export type InsertPlatform = z.infer<typeof insertPlatformSchema>;
export type InsertUserApiKey = z.infer<typeof insertUserApiKeySchema>;
export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;
export type InsertTradeLog = z.infer<typeof insertTradeLogSchema>;
export type InsertUserBalance = z.infer<typeof insertUserBalanceSchema>;

// Export auth models too so they are available
export * from "./models/auth";
export * from "./models/chat"; // Chat integration models
