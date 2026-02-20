# FlashMind - Flashcard Study App

## Overview
FlashMind is a mobile flashcard app built with Expo (React Native) and Express backend. Users can create flashcard sets, study with flip mode, and review with swipe mode (right = know it, left = still learning). Google OAuth authentication enables cross-device syncing.

## Recent Changes
- 2026-02-20: Added Google OAuth login with server-side data persistence
- 2026-02-20: Migrated from AsyncStorage to PostgreSQL for flashcard storage
- 2026-02-20: Added auth context, login screen, and user session management

## Architecture
- **Frontend**: Expo Router (file-based routing), React Native
- **Backend**: Express + TypeScript on port 5000
- **Database**: PostgreSQL (Neon-backed via Replit)
- **Auth**: Google OAuth via expo-auth-session, sessions via express-session + connect-pg-simple
- **State**: React Query for server state, useState for local state
- **Fonts**: DM Sans (400, 500, 600, 700)
- **Colors**: Green primary (#1B6B4A), Orange accent (#FF6B35)

## Project Structure
- `app/` - Expo Router screens (login, index, create, study/[id], swipe/[id])
- `app/_layout.tsx` - Root layout with AuthProvider, QueryClient, fonts
- `lib/api.ts` - API functions for server communication
- `lib/auth-context.tsx` - Auth context with Google sign-in/out
- `lib/query-client.ts` - React Query client and API helpers
- `server/routes.ts` - Express API routes (auth + CRUD for flashcard sets)
- `server/storage.ts` - Database queries (Drizzle ORM)
- `server/db.ts` - Database connection pool
- `shared/schema.ts` - Drizzle schema (users, flashcard_sets tables)
- `constants/colors.ts` - App color palette

## User Preferences
- Clean stack navigation (no tab bar)
- DM Sans typography (not Space Grotesk)
- Green/orange color theme
- Swipe left = still learning (card goes back to end of deck)

## Key Decisions
- Google Client ID served from backend `/api/auth/config` endpoint (not env var)
- Session-based auth with cookies (express-session + PostgreSQL session store)
- User avatar shown in header, tapping it shows sign out option
