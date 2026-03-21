# MenuFlow AI

## Architecture

Next.js 16 app (React 19) with Gemini AI for menu scanning and dish image generation.

### Data Flow
- **Menu photos** → `/api/process-menu` (Gemini AI) → structured JSON with sections (Soups, Salads, Starters, Main dishes, Desserts, Drinks)
- **Dish images** → `/api/generate-image` (Gemini) → saved to `/public/menu-images/`
- **Menu storage** → Neon Postgres via `/api/menus` routes
- **User preferences** → browser localStorage (not in DB, stays client-side)
- **Telegram bot** → webhook at `/api/telegram/webhook` → onboarding flow (allergies, spice, excludes) → process menu photo → save to DB → reply with personalized summary + link

### Key Files

#### API Routes
- `app/api/menus/route.js` — POST (save) + GET (list) menus in Neon Postgres
- `app/api/menus/[id]/route.js` — GET / PUT / DELETE single menu
- `app/api/telegram/webhook/route.js` — Telegram bot webhook handler
- `app/api/process-menu/route.js` — Gemini menu extraction (DO NOT MODIFY)
- `app/api/generate-image/route.js` — Gemini image generation (DO NOT MODIFY)
- `app/api/delete-menu-images/route.js` — image cleanup (DO NOT MODIFY)

#### Libraries
- `lib/storage.js` — async API client for menus + localStorage for preferences
- `lib/telegram.js` — Telegram Bot API helpers, keyboard builders, DB helpers for telegram_users
- `lib/constants.js` — app constants (DO NOT MODIFY)

#### Pages
- `app/page.jsx` — home page: upload menu photos, view/filter dishes, load saved menu via `?menu={id}`
- `app/saved/page.jsx` — list saved menus with async loading
- `app/profile/page.jsx` — user preferences form (DO NOT MODIFY)

### Database (Neon Postgres)

**Table: `menus`**
```sql
id TEXT PK, saved_at TIMESTAMP, restaurant_name TEXT, location TEXT, language TEXT, menu JSONB
```

**Table: `telegram_users`**
```sql
chat_id BIGINT PK, state TEXT, allergies TEXT[], spice_tolerance TEXT, exclude_ingredients TEXT[], created_at TIMESTAMP, updated_at TIMESTAMP
```

Setup script: `db/setup.sql`

### Telegram Bot Conversation Flow
1. `/start` → welcome with two options:
   - **Voice shortcut:** send a voice message with all preferences → Gemini extracts allergies/spice/excludes in one shot → skip to ready
   - **Manual:** allergy selection (inline keyboard toggles)
2. → spice tolerance (5-option inline keyboard)
3. → excluded ingredients (free text or /skip)
4. → ready state: "Send me a menu photo!"
5. Photo → process via `/api/process-menu` → save to DB → reply with personalized summary + link
6. `/preferences` → restart onboarding
7. Voice messages during ANY onboarding state trigger Gemini voice extraction

### Environment Variables
- `GEMINI_API_KEY` — Google Gemini API key
- `DATABASE_URL` — Neon Postgres connection string
- `TELEGRAM_BOT_TOKEN` — Telegram bot token from BotFather
- `NEXT_PUBLIC_APP_URL` — App base URL for generating menu links
- `NEXT_PUBLIC_IMAGE_GEN_RPM` — Rate limit for image generation
- `GEMINI_MODEL` — Gemini model for menu processing
- `NANOBANANA_API_KEY` / `NANOBANANA_MODEL` — Optional image gen provider

### Column ↔ Property Mapping
- DB `restaurant_name` ↔ JS `restaurantName`
- DB `saved_at` ↔ JS `savedAt`
- DB `spice_tolerance` ↔ JS `spice_tolerance`
- DB `exclude_ingredients` ↔ JS `exclude_ingredients`

### DO NOT MODIFY
- Any files in `components/`
- `lib/constants.js`
- `app/profile/page.jsx`
- `app/api/process-menu/route.js`
- `app/api/generate-image/route.js`
- `app/api/delete-menu-images/route.js`
