# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- `npm run build` - Build the web component using Rollup
- `npm run build:watch` - Build with watch mode for development
- `npm run dev` - Start development server with build watching and serving
- `npm run serve` - Start development server with Web Dev Server

## Linting and Code Quality

- `npx eslint .` - Run ESLint on the codebase
- `npx prettier --write .` - Format code with Prettier
- `npx tsc --noEmit` - Type check TypeScript without emitting files

## Architecture Overview

This is a **Tolki Chat Web Component** built with Lit Element that provides an embeddable chat interface. The component
is distributed as a standalone web component that can be embedded in any web application.

### Key Components

- **`TolkiChat`** (`src/tolki-chat/tolki-chat.ts`) - Main chat component that handles the entire chat interface
- **`TolkiBot`** (`src/tolki-bot/tolki-bot.ts`) - Bot configuration and initialization management
- **`TolkiApi`** (`src/tolki-api/tolki-api.ts`) - API client for communicating with Tolki backend
- **`TolkiChatItem`** (`src/tolki-chat/tolki-chat-item.ts`) - Individual chat message components

### State Management

- Uses `@lit-app/state` for reactive state management
- State is persisted in localStorage with bot-specific settings
- Chat history is saved per bot instance

### Build System

- **Rollup** for bundling with TypeScript, PostCSS, and Lit CSS processing
- **Output**: Single IIFE bundle in `dist/` directory
- **Styling**: SCSS with PostCSS processing and Lit CSS integration

### Key Features

- Floating chat widget that can be toggled open/closed
- Inline mode for embedding directly in pages
- Customizable styling through bot configuration
- Message history persistence
- Virtual keyboard detection for mobile
- Chat reset functionality
- Suggestions support
- Responsive design with scroll management

### External Dependencies

- **Lit** - Web component framework
- **@fullbrains/okuda** - Color system for theming
- **autosize** - Automatic textarea resizing
- **on-screen-keyboard-detector** - Mobile keyboard detection
- **@fntools/crypto** and **uuid** - Encryption and UUID utilities

### Entry Point

The main entry point is `src/chat.ts` which simply imports and registers the `tolki-chat` custom element.

### API Integration

The component connects to `https://api.tolki.ai/chat/v1/embed/` for:

- Bot settings retrieval
- Message sending and receiving
- Multi-language support

### Development Notes

- Component uses shadow DOM for style encapsulation
- State is shared between multiple instances via singleton pattern
- Event listeners are managed in the `updated()` lifecycle method
- Supports both branded and unbranded modes