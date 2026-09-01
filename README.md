# DCRDCI — AI Companion with Memory

> An AI chat companion that remembers you. Conversations are distilled into structured memory documents, organized by folders, and injected as context (Main_link) into future chats — so the AI truly knows you over time.

[中文文档](./README.zh-CN.md)

---

## Features

- **AI Chat with Memory** — Every conversation is automatically distilled into compact theme-based documents after each reply
- **Main_link Context Injection** — Select folders → their documents are merged into a single context block → injected as system prompt for every new message
- **Folder-based Document Organization** — Documents can belong to multiple folders; folders act as selectable memory scopes
- **Document Lifecycle** — `pending` → `kept` / `discarded`; preview, edit, regenerate at any time
- **Speech Input** — Web Speech API integration with auto-stop on silence
- **Token Usage Dashboard** — Heatmap, daily/monthly charts, per-type breakdown
- **Growth Timeline** — Visualize all memories chronologically with stats (companion days, total memories, themes)
- **Fully Local** — All data stored in browser IndexedDB via Dexie; no backend required

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3 (Composition API + `<script setup>`) |
| Language | TypeScript |
| Build | Vite 8 |
| State | Pinia 4 |
| Database | Dexie 4 (IndexedDB) |
| AI SDK | OpenAI (browser mode) |
| Markdown | marked + DOMPurify |
| Router | Vue Router 5 |

---

## Project Structure

```
src/
├── assets/styles/        # Global CSS (reset, variables, base)
├── components/
│   ├── chat/             # ChatPanel, MessageBubble
│   ├── common/           # AppModal, SettingsModal, ThemeTag
│   ├── document/         # DocumentPanel, DocPreviewModal, DocEditModal
│   └── folder/           # FolderPanel, FolderEditModal
├── composables/
│   ├── useChat.ts        # Core chat orchestration (send, summarize, Main_link)
│   ├── useError.ts       # Transient error message handler
│   ├── useSpeechRecognition.ts  # Web Speech API wrapper
│   └── useTokenUsage.ts  # Token usage tracking & aggregation
├── constants/index.ts    # BUILTIN_API_KEY, storage keys
├── db/index.ts           # Dexie DB schema & migrations (v1→v4)
├── layouts/              # DefaultLayout.vue
├── router/index.ts       # Routes: /, /timeline, /usage
├── services/
│   └── ai.service.ts     # All AI calls: chat, Main_link, summary, title
├── stores/
│   ├── chat.ts           # Sessions, messages, streaming state
│   ├── document.ts       # Documents CRUD, folder-based queries
│   ├── folder.ts         # Folder CRUD
│   └── settings.ts       # API settings (persisted to localStorage)
├── types/index.ts        # TypeScript interfaces & defaults
├── utils/index.ts        # ID generation, formatting, timeout helper
└── views/
    ├── HomeView.vue      # Main 3-panel layout
    ├── TimelineView.vue  # Growth timeline
    └── UsageView.vue     # Token usage dashboard
```

---

## Data Model

### Session

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique ID |
| `title` | `string` | Auto-generated from first message or AI |
| `selectedFolderIds` | `string[]` | Folders whose documents form the Main_link context |
| `mainLinkContent` | `string` | Merged context string from selected folders' documents |
| `createdAt` / `updatedAt` | `number` | Timestamps |

### Message

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique ID |
| `sessionId` | `string` | Parent session |
| `role` | `'user' \| 'assistant'` | Sender |
| `content` | `string` | Message text |
| `createdAt` | `number` | Timestamp |

### Document

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique ID |
| `sessionId` | `string` | Originating session |
| `folderIds` | `string[]` | Belongs-to folders (many-to-many) |
| `theme` | `string` | Short theme tag (2–4 chars) |
| `title` | `string` | Document title |
| `content` | `string` | Condensed content |
| `status` | `'pending' \| 'kept' \| 'discarded'` | Lifecycle state |
| `createdAt` | `number` | Timestamp |

### Folder

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique ID |
| `name` | `string` | Display name |
| `icon` | `string` | Emoji icon |
| `description` | `string` | Folder description |
| `createdAt` | `number` | Timestamp |

### Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `apiKey` | `string` | `''` | User-provided API key (falls back to built-in) |
| `baseUrl` | `string` | `https://api.deepseek.com/v1` | API base URL |
| `model` | `string` | `deepseek-chat` | Model name |
| `generateTimeout` | `number` | `60000` | Request timeout (ms) |

---

## Core Workflow

```
User sends message
       │
       ▼
  addMessage('user')
       │
       ▼
  sendMessage() ─── streams AI reply with Main_link as system context
       │
       ▼
  addMessage('assistant')
       │
       ▼
  autoGenerateDocs() ─── AI splits conversation into theme documents
       │                        │
       │                        ▼
       │                 documents saved to IndexedDB
       │                 assigned to session's selected folders
       │
       ▼
  (User toggles folder selection)
       │
       ▼
  generateMainLink() ─── AI merges all docs in selected folders
       │                        │
       │                        ▼
       │                 session.mainLinkContent updated
       │                 (injected as context in next chat)
       │
       ▼
  Next message uses updated Main_link
```

---

## AI Service API

All AI calls are in `src/services/ai.service.ts`:

| Function | Purpose | Temperature |
|----------|---------|-------------|
| `sendMessage(messages, mainLink, onDelta)` | Chat with streaming, Main_link injected as system prompt | default |
| `generateMainLink(docs)` | Merge multiple documents into one coherent context block | 0.3 |
| `generateSummaryDocs(messages)` | Split conversation into compact theme documents (JSON array) | 0.5 |
| `generateTitle(docs)` | Generate a ≤10-char session title from document themes | 0.3 |

Error handling maps HTTP status codes to user-friendly messages (401→invalid key, 404→model not found, 429→rate limited, 5xx→server error).

---

## Database Migrations

Dexie schema is at version 4. Migration history:

| Version | Changes |
|---------|---------|
| v1 | Initial: sessions, messages, documents, roles |
| v2 | Replaced `roles` with `folders`; added `folderId` to documents & sessions |
| v3 | Renamed `emotion` → `theme`; added `selectedFolderIds`, `mainLinkContent` to sessions |
| v4 | Changed `folderId` (single) → `folderIds` (array, many-to-many) |

---

## Routes

| Path | View | Description |
|------|------|-------------|
| `/` | HomeView | Main 3-panel layout (folders, documents, chat) |
| `/timeline` | TimelineView | Growth timeline with memory stats |
| `/usage` | UsageView | Token usage dashboard with heatmap |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 22.18 or ≥ 24.12
- npm

### Install & Run

```bash
npm install
npm run dev
```

### Build for Production

```bash
npm run build
```

### Type Check

```bash
npm run type-check
```

---

## Configuration

Open the ⚙ Settings modal in the app to configure:

- **API Key** — Your DeepSeek (or OpenAI-compatible) API key. A built-in key is provided as fallback.
- **Base URL** — API endpoint (default: `https://api.deepseek.com/v1`)
- **Model** — Model name (default: `deepseek-chat`)
- **Timeout** — Request timeout in ms (default: 60000)

Settings are persisted in `localStorage` under key `dcrdci-settings`.

---

## IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (disable Vetur if present)
- Browser: [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) extension

---

## License

Private — all rights reserved.