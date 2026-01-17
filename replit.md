# Replit.md

## Overview

This is a Trading ERP application - an AI-powered cryptocurrency arbitrage trading bot with a modern React frontend and Express backend. The application monitors price differences across multiple exchanges (Binance, Kraken, KuCoin, etc.) to identify and execute arbitrage opportunities. It features RTL Arabic language support, a SAP Fiori-inspired design system, and integrations for Replit Auth, AI chat, and voice capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Styling**: Tailwind CSS with shadcn/ui components (New York style)
- **UI Components**: Radix UI primitives with custom styling
- **Charts**: Recharts for data visualization
- **Animations**: Framer Motion for page transitions and UI animations
- **RTL Support**: Full Arabic language support with RTL layout (dir="rtl")

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: REST API with typed routes defined in `shared/routes.ts`
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: express-session with connect-pg-simple for PostgreSQL session storage
- **Authentication**: Replit Auth (OpenID Connect) via Passport.js
- **AI Integration**: OpenAI-compatible API through Replit AI Integrations

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (main schema), `shared/models/` (auth and chat models)
- **Migrations**: Drizzle Kit with `db:push` command
- **Tables**:
  - `users` and `sessions`: Replit Auth (required, do not modify)
  - `platforms`: Exchange configurations
  - `user_api_keys`: Encrypted API credentials per user
  - `bot_settings`: Trading bot configuration per user
  - `trade_logs`: Historical trade records
  - `ai_logs`: AI decision logs
  - `conversations` and `messages`: Chat history

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: esbuild bundles server, Vite builds client to `dist/public`
- **Type Checking**: TypeScript with path aliases (`@/` for client, `@shared/` for shared)

### Key Design Patterns
- **Shared Types**: Schema and route definitions in `shared/` are used by both frontend and backend
- **Storage Pattern**: `server/storage.ts` implements `IStorage` interface for all database operations
- **Replit Integrations**: Modular integrations in `server/replit_integrations/` for auth, chat, audio, image, and batch processing
- **API Route Structure**: Centralized route definitions with Zod schemas in `shared/routes.ts`

## External Dependencies

### Database
- PostgreSQL (required, provision via Replit Database)
- Connection via `DATABASE_URL` environment variable

### Authentication
- Replit Auth (OpenID Connect)
- Required environment variables: `REPL_ID`, `ISSUER_URL`, `SESSION_SECRET`

### AI Services
- OpenAI-compatible API via Replit AI Integrations
- Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
- Supports text chat, voice (speech-to-text, text-to-speech), and image generation

### Third-Party Libraries
- `connect-pg-simple`: PostgreSQL session storage
- `passport` with `openid-client`: Authentication flow
- `drizzle-orm` with `drizzle-zod`: Database ORM and schema validation
- `@tanstack/react-query`: Server state management
- Radix UI: Accessible component primitives
- Recharts: Data visualization

### Development Tools
- Vite with React plugin
- Replit-specific plugins for dev banner and cartographer
- esbuild for production server bundling