import { z } from 'zod';
import { insertBotSettingsSchema, insertUserApiKeySchema, tradeLogs, platforms, botSettings } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  platforms: {
    list: {
      method: 'GET' as const,
      path: '/api/platforms',
      responses: {
        200: z.array(z.custom<typeof platforms.$inferSelect>()),
      },
    },
  },
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings',
      responses: {
        200: z.custom<typeof botSettings.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'POST' as const,
      path: '/api/settings',
      input: insertBotSettingsSchema.partial(),
      responses: {
        200: z.custom<typeof botSettings.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  keys: {
    list: {
      method: 'GET' as const,
      path: '/api/keys',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          platformId: z.number(),
          platformName: z.string(),
          label: z.string().nullable(),
          createdAt: z.string(),
        })),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/keys',
      input: insertUserApiKeySchema,
      responses: {
        201: z.object({ id: z.number() }),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/keys/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  logs: {
    list: {
      method: 'GET' as const,
      path: '/api/logs',
      responses: {
        200: z.array(z.custom<typeof tradeLogs.$inferSelect>()),
      },
    },
  },
  dashboard: {
    stats: {
      method: 'GET' as const,
      path: '/api/dashboard/stats',
      responses: {
        200: z.object({
          totalProfit: z.string(),
          activeBots: z.number(),
          riskScore: z.number(),
          tradesToday: z.number(),
        }),
      },
    },
  },
};
