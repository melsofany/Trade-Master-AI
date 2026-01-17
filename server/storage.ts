import {
  platforms, userApiKeys, botSettings, tradeLogs, aiLogs,
  type Platform, type UserApiKey, type BotSettings, type TradeLog, type AiLog,
  type InsertPlatform, type InsertUserApiKey, type InsertBotSettings, type InsertTradeLog
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Platforms
  getPlatforms(): Promise<Platform[]>;
  getPlatform(id: number): Promise<Platform | undefined>;
  createPlatform(platform: InsertPlatform): Promise<Platform>;

  // Settings
  getBotSettings(userId: string): Promise<BotSettings | undefined>;
  upsertBotSettings(settings: InsertBotSettings): Promise<BotSettings>;

  // API Keys
  getUserApiKeys(userId: string): Promise<UserApiKey[]>;
  createUserApiKey(key: InsertUserApiKey): Promise<UserApiKey>;
  deleteUserApiKey(id: number, userId: string): Promise<void>;

  // Logs
  getTradeLogs(userId: string): Promise<TradeLog[]>;
  createTradeLog(log: InsertTradeLog): Promise<TradeLog>;
  getDashboardStats(userId: string): Promise<{ totalProfit: number, tradesToday: number }>;
}

export class DatabaseStorage implements IStorage {
  // Platforms
  async getPlatforms(): Promise<Platform[]> {
    return await db.select().from(platforms);
  }

  async getPlatform(id: number): Promise<Platform | undefined> {
    const [platform] = await db.select().from(platforms).where(eq(platforms.id, id));
    return platform;
  }

  async createPlatform(platform: InsertPlatform): Promise<Platform> {
    const [newPlatform] = await db.insert(platforms).values(platform).returning();
    return newPlatform;
  }

  // Settings
  async getBotSettings(userId: string): Promise<BotSettings | undefined> {
    const [settings] = await db.select().from(botSettings).where(eq(botSettings.userId, userId));
    return settings;
  }

  async upsertBotSettings(settings: InsertBotSettings): Promise<BotSettings> {
    const [existing] = await db.select().from(botSettings).where(eq(botSettings.userId, settings.userId));
    
    if (existing) {
      const [updated] = await db.update(botSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(botSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(botSettings).values(settings).returning();
      return created;
    }
  }

  // API Keys
  async getUserApiKeys(userId: string): Promise<UserApiKey[]> {
    return await db.select().from(userApiKeys).where(eq(userApiKeys.userId, userId));
  }

  async createUserApiKey(key: InsertUserApiKey): Promise<UserApiKey> {
    const [newKey] = await db.insert(userApiKeys).values(key).returning();
    return newKey;
  }

  async deleteUserApiKey(id: number, userId: string): Promise<void> {
    await db.delete(userApiKeys).where(and(eq(userApiKeys.id, id), eq(userApiKeys.userId, userId)));
  }

  // Logs
  async getTradeLogs(userId: string): Promise<TradeLog[]> {
    return await db.select().from(tradeLogs)
      .where(eq(tradeLogs.userId, userId))
      .orderBy(desc(tradeLogs.executedAt));
  }

  async createTradeLog(log: InsertTradeLog): Promise<TradeLog> {
    const [newLog] = await db.insert(tradeLogs).values(log).returning();
    return newLog;
  }

  async getDashboardStats(userId: string): Promise<{ totalProfit: number, tradesToday: number }> {
    const logs = await this.getTradeLogs(userId);
    const totalProfit = logs.reduce((sum, log) => sum + Number(log.profitUsdt || 0), 0);
    
    // Simple today check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tradesToday = logs.filter(log => {
      const logDate = new Date(log.executedAt!);
      return logDate >= today;
    }).length;

    return { totalProfit, tradesToday };
  }
}

export const storage = new DatabaseStorage();
