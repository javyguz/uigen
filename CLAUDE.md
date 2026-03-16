# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator built with Next.js 15 (App Router). Users describe components in natural language, Claude generates them via tool calls, and a live preview renders them in an iframe.

## Commands

```bash
npm run dev          # Start dev server (Next.js + Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (watch mode)
npx vitest run       # Run tests once
npx vitest run src/lib/__tests__/file-system.test.ts  # Single test file
npm run setup        # Install deps + Prisma generate + migrate
npm run db:reset     # Reset database (destructive)
```

Note: Dev/build/start commands use `cross-env NODE_OPTIONS="--require ./node-compat.cjs"` for Node compatibility shims.

## Architecture

### Core Flow
1. User sends chat message → `/api/chat` streaming endpoint
2. Claude (Haiku 4.5 default) receives system prompt + message history
3. Claude calls `str_replace_editor` or `file_manager` tools to create/edit files
4. `FileSystemContext` processes tool calls, updates `VirtualFileSystem` (in-memory)
5. `PreviewFrame` transpiles JSX via Babel standalone and renders in iframe
6. Project auto-saved to SQLite via Prisma (authenticated users only)

### Key Abstractions
- **VirtualFileSystem** (`src/lib/file-system.ts`) — In-memory file system with create/read/update/delete/rename, serialization for DB persistence
- **ChatContext** (`src/lib/contexts/chat-context.tsx`) — Wraps Vercel AI SDK `useChat`, handles tool call processing
- **FileSystemContext** (`src/lib/contexts/file-system-context.tsx`) — Global virtual FS state and operations
- **JSX Transformer** (`src/lib/transform/jsx-transformer.ts`) — Babel transpilation + HTML generation for preview iframe

### Tools (Claude-facing)
- `str_replace_editor` (`src/lib/tools/str-replace.ts`) — Create new files or edit existing ones with string replacement
- `file_manager` (`src/lib/tools/file-manager.ts`) — Rename/delete files

### Layout
3-panel resizable UI: Chat (35%) | Preview+Code (65%). Code view splits into FileTree (30%) | Monaco Editor (70%).

## Tech Stack
- **Next.js 15** with App Router, React 19, TypeScript
- **Tailwind CSS v4** (PostCSS plugin, OKLch color variables)
- **shadcn/ui** (New York style, Radix primitives) — components in `src/components/ui/`
- **Prisma** with SQLite — schema in `prisma/schema.prisma`
- **Vercel AI SDK** + **Anthropic SDK** for streaming AI responses
- **Monaco Editor** for code editing, **Babel Standalone** for runtime transpilation
- **JWT auth** via `jose` + bcrypt password hashing

## Code Conventions
- Server actions live in `src/actions/` with `"use server"` directive
- Client components use `"use client"` directive
- Server-only modules import `"server-only"` package
- Path alias: `@/` maps to `src/`
- Components: PascalCase names, kebab-case filenames
- AI model provider configured in `src/lib/provider.ts` — falls back to mock when `ANTHROPIC_API_KEY` is missing
- System prompt for generation in `src/lib/prompts/generation.tsx`

## Environment Variables
- `ANTHROPIC_API_KEY` — Optional; mock provider used if missing
- `JWT_SECRET` — Auto-generated in dev if absent

## Testing
- Vitest + React Testing Library + jsdom
- Tests co-located in `__tests__/` directories next to source
- Config: `vitest.config.mts`
