# MenuFlow AI

## Architecture

Next.js 16 app (React 19) with Gemini AI for menu scanning and dish image generation.

### Data Flow
- **Menu photos** → `/api/process-menu` (Gemini AI) → structured JSON
- **Dish images** → server-side generation via `lib/server/generate-menu-images.js`
- **Menu storage** → Upstash Redis via `lib/server/menu-store.js`, exposed through `/api/menus` routes
- **User preferences** → browser localStorage (client-side only)
- **Telegram bot** → webhook at `/api/telegram/webhook` → onboarding → process menu → save → reply with public link
- **Telegram user state** → Upstash Redis (key pattern: `tg_user:{chatId}`)

### Storage: Upstash Redis
All persistent data uses Upstash Redis (NOT Neon Postgres):
- Menus: `menu:{id}` — JSON with session-based ownership
- Owner index: `menus:owner:{sessionId}` — array of menu IDs
- Telegram users: `tg_user:{chatId}` — JSON with state, allergies, spice, excludes

### Key Files

#### API Routes
- `app/api/menus/route.js` — POST/GET/DELETE menus (session cookie ownership)
- `app/api/menus/[id]/route.js` — GET/PATCH/DELETE single menu
- `app/api/telegram/webhook/route.js` — Telegram bot webhook
- `app/api/process-menu/route.js` — Gemini menu extraction (DO NOT MODIFY)
- `app/api/generate-image/route.js` — Gemini image generation (DO NOT MODIFY)

#### Server Libraries
- `lib/server/menu-store.js` — Redis CRUD for menus with session ownership
- `lib/server/generate-menu-images.js` — server-side image generation
- `lib/serverEnv.js` — server environment helpers

#### Client Libraries
- `lib/storage.js` — async API client for menus + localStorage for preferences
- `lib/telegram.js` — Telegram Bot API, keyboard builders, Redis user state, Gemini voice extraction
- `lib/constants.js` — app constants (DO NOT MODIFY)

#### Pages
- `app/page.jsx` — home: upload menu photos, view/filter dishes, load via `?menu={id}`
- `app/menu/[id]/page.jsx` — public shareable menu page
- `app/saved/page.jsx` — list saved menus with async loading
- `app/profile/page.jsx` — user preferences form

### API Response Shapes
- `POST /api/menus` → `{ menu: { id, publicUrl, restaurantName, ... } }` (status 201)
- `GET /api/menus` → `{ menus: [...] }`
- `GET /api/menus/[id]` → `{ menu: { ... } }`
- `PATCH /api/menus/[id]` → `{ menu: { ... } }`
- `DELETE /api/menus/[id]` → `{ menu: { ... } }`

### Telegram Bot Conversation Flow
1. `/start` → welcome with two options:
   - **Voice shortcut:** voice message → Gemini extracts allergies/spice/excludes → skip to ready
   - **Manual:** allergy selection (inline keyboard toggles)
2. → spice tolerance (5-option inline keyboard)
3. → excluded ingredients (free text or /skip)
4. → ready: "Send me a menu photo!"
5. Photo → `/api/process-menu` → save via `/api/menus` → reply with summary + `/menu/{id}` link
6. `/preferences` → restart onboarding

### Environment Variables
- `GEMINI_API_KEY` — Google Gemini API key
- `GEMINI_MODEL` — Gemini model name
- `UPSTASH_REDIS_REST_URL` — Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis token
- `TELEGRAM_BOT_TOKEN` — Telegram bot token from BotFather
- `NEXT_PUBLIC_APP_URL` — App base URL for generating menu links
- `NEXT_PUBLIC_IMAGE_GEN_RPM` — Rate limit for image generation

### DO NOT MODIFY
- `app/api/process-menu/route.js`
- `app/api/generate-image/route.js`
- `lib/server/menu-store.js`
- `lib/server/generate-menu-images.js`
- `lib/constants.js`
