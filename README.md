# MMP Prompt Studio — Test Repo

A standalone test environment for the **Prompt Studio** feature of [MarkMyPrompt](https://markmyprompt.com).
Use this repo to develop and validate the Prompt Studio UI before integrating it into the main `mmt-frontend` codebase.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **localStorage** for persistence (no database)
- No authentication (simulated logged-in user)

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Folder Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with Sidebar
│   ├── page.tsx                # Studio page (main three-panel editor)
│   ├── globals.css             # Global styles + variable highlight
│   ├── library/
│   │   └── page.tsx            # Saved prompts library
│   └── settings/
│       └── page.tsx            # API key + model settings
├── components/
│   ├── Sidebar.tsx             # Left sidebar navigation
│   ├── HighlightedEditor.tsx   # Prompt textarea with {{variable}} highlighting
│   ├── EditorToolbar.tsx       # Clear / Copy / Save buttons
│   ├── VariableInputs.tsx      # Auto-detected variable input fields
│   ├── Preview.tsx             # Filled prompt preview + Run button
│   ├── Output.tsx              # Streamed AI response panel
│   ├── ApiKeyModal.tsx         # Modal to add OpenAI API key
│   └── SavePromptModal.tsx     # Modal to save prompt with title + tags
├── hooks/
│   └── useVariableDetection.ts # Regex-based {{var}} detection + fill
├── lib/
│   ├── storage.ts              # localStorage CRUD (all marked with TODO)
│   └── openai.ts               # Direct OpenAI streaming call (marked TODO)
└── types/
    └── index.ts                # TypeScript interfaces
```

## Key Features

- **Prompt editor** with live `{{variable}}` highlighting (orange #D85A30)
- **Variable detection** — auto-detects variables and shows input fields
- **Live preview** — fills variables in real-time
- **OpenAI streaming** — streams responses from gpt-3.5-turbo / gpt-4
- **Prompt library** — save, browse, and reload prompts
- **Settings** — API key management + model selection

## Integration Guide

When integrating into the main `mmt-frontend` repo:

### 1. Replace localStorage with Real API Calls

Every file in `src/lib/storage.ts` has `TODO: Replace localStorage with real API call` comments.
Swap each function with calls to your backend API:

- `savePrompt()` → `POST /api/prompts`
- `getPrompts()` → `GET /api/prompts`
- `deletePrompt()` → `DELETE /api/prompts/:id`
- `saveAnswer()` → `POST /api/answers`
- `getApiKey()` / `setApiKey()` → Server-side encrypted storage
- `getDefaultModel()` / `setDefaultModel()` → `GET/PUT /api/settings`

### 2. Replace Direct OpenAI Call with Server Proxy

`src/lib/openai.ts` calls the OpenAI API directly from the client (fine for testing).
In production, create a Next.js API route (e.g. `POST /api/run-prompt`) that proxies the
request server-side so the API key is never exposed to the browser.

### 3. Add Clerk Authentication

- Wrap the app in `<ClerkProvider>`
- Replace the simulated user with `useUser()` from `@clerk/nextjs`
- Add `userId` to saved prompts/answers
- Protect routes with Clerk middleware

### 4. Swap Sidebar into Existing Dashboard

The `Sidebar.tsx` component is self-contained. Replace it with your existing
dashboard sidebar or merge the nav items into it.

### 5. Files That Will Change During Integration

- `src/lib/storage.ts` — Replace all localStorage calls with API calls
- `src/lib/openai.ts` — Move to server-side API route
- `src/app/layout.tsx` — Wrap in ClerkProvider, use existing layout
- `src/components/Sidebar.tsx` — Merge into existing dashboard nav
- `src/app/page.tsx` — Add auth guards, real prompt IDs
- `src/app/library/page.tsx` — Fetch from API instead of localStorage
- `src/app/settings/page.tsx` — Store settings server-side

## Design Tokens

- Background: `#faf9f6` (warm off-white)
- Accent: `#D85A30` (MMP red-orange)
- Sidebar: `#0e0e0e` (dark)
- Font: System font stack
