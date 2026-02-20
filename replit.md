# FlashMind - Flashcard & Notes App

## Overview
FlashMind is a fully local, offline mobile app built with Expo (React Native). Users can create flashcard sets for studying and rich-formatted notes with tasks, organized into notebooks with hierarchical stacks. All data is stored locally using AsyncStorage with no backend or authentication required.

## Recent Changes
- 2026-02-20: Added Notes feature with rich content blocks, tags, tasks, and notebooks
- 2026-02-20: Converted to tab-based navigation (Flashcards + Notes tabs)
- 2026-02-20: Removed backend/auth - app is now fully local/offline

## Architecture
- **Frontend**: Expo Router (file-based routing), React Native
- **Navigation**: Tab-based (Flashcards + Notes)
- **Storage**: AsyncStorage for all local data
- **State**: React Query for server state, useState for local state
- **Fonts**: DM Sans (400, 500, 600, 700)
- **Colors**: Green primary (#1B6B4A), Orange accent (#FF6B35)

## Project Structure
- `app/(tabs)/_layout.tsx` - Tab layout with Flashcards and Notes tabs
- `app/(tabs)/index.tsx` - Flashcards home screen
- `app/(tabs)/notes.tsx` - Notes list with search
- `app/_layout.tsx` - Root layout with providers and fonts
- `app/create.tsx` - Create flashcard set
- `app/edit/[id].tsx` - Edit flashcard set
- `app/study/[id].tsx` - Study mode (flip cards)
- `app/swipe/[id].tsx` - Swipe review mode
- `app/notes/create.tsx` - Create new note
- `app/notes/[id].tsx` - View/edit note
- `app/notebooks/manage.tsx` - Notebooks management with stacks
- `app/notebooks/[id].tsx` - View notes in a notebook
- `lib/api.ts` - Flashcard storage functions (AsyncStorage)
- `lib/notes-storage.ts` - Notes & notebooks storage (AsyncStorage)
- `lib/auth-context.tsx` - Auth context (local-only)
- `lib/query-client.ts` - React Query client
- `constants/colors.ts` - App color palette

## Notes Feature
- Rich content blocks: text, headings, bullet lists, numbered lists, checkboxes
- Tasks with completion status tracking
- Tags (#tag syntax) for categorization
- Pin important notes to top
- Search across titles, content, tags
- Notebooks with color coding and hierarchical stacks (parent/child)

## User Preferences
- Tab-based navigation for Flashcards and Notes
- DM Sans typography (not Space Grotesk)
- Green/orange color theme
- Swipe left = still learning (card goes back to end of deck)
- All data stays local and offline (AsyncStorage)

## Key Decisions
- No backend server - everything runs locally
- Rich content uses structured ContentBlock types (not WYSIWYG editor)
- Notes support tags, tasks, pinning, and notebook assignment
- Notebooks support hierarchical stacks with color coding
