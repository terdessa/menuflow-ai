# MenuFlow AI — Telegram Bot + Neon Postgres Migration

You are working on **MenuFlow AI**, a Next.js 16 app (React 19) that scans
restaurant menu photos with Gemini AI, applies dietary filters, and generates
dish preview images.

Your job: add Telegram bot support and migrate menu storage from
`localStorage` to a **Neon Postgres** database.

---

## GOLDEN RULES

1. **DO NOT touch** any existing UI components, filtering logic, or these API routes:
   - `app/api/process-menu/route.js`
   - `app/api/generate-image/route.js`
   - `app/api/delete-menu-images/route.js`
2. **DO NOT rename** any existing exported function.
3. **DO NOT modify** `components/*`, `lib/constants.js`, `app/profile/page.jsx`,
   `app/layout.jsx`, `app/globals.css`.
4. The app must still work identically in the browser after all changes.
5. All new code uses `async/await`. No callbacks, no `.then()` in new code.
6. After completing all steps, update `CLAUDE.md` at the project root with a
   summary of architecture changes so future sessions have full context.

---

## CONTEXT: Current Architecture

```
menuflow-ai/
├── app/
│   ├── api/
│   │   ├── process-menu/route.js   ← DO NOT TOUCH (accepts FormData with field "images")
│   │   ├── generate-image/route.js  ← DO NOT TOUCH
│   │   └── delete-menu-images/route.js ← DO NOT TOUCH
│   ├── page.jsx                     ← home page (MODIFY in Step 7)
│   ├── saved/page.jsx               ← saved menus page (MODIFY in Step 8)
│   ├── profile/page.jsx             ← DO NOT TOUCH
│   └── layout.jsx                   ← DO NOT TOUCH
├── components/                      ← DO NOT TOUCH (MenuCard, FilterPanel, etc.)
├── lib/
│   ├── storage.js                   ← REWRITE in Step 4
│   └── constants.js                 ← DO NOT TOUCH
├── .env                             ← add new vars here (NOT .env.local)
├── next.config.js
└── package.json
```

### Current `lib/storage.js` exports (ALL must be preserved):

```js
// Preferences (keep as localStorage — do NOT migrate to DB)
getPreferences()          → returns object | null
savePreferences(prefs)    → void

// Menus (migrate these to Neon Postgres)
getSavedMenus()           → returns array of menu objects
saveMenu(menu)            → returns { ...menu, id }
getMenuById(id)           → returns menu object | undefined
deleteMenuById(id)        → returns deleted menu object | null
updateSavedMenu(id, data) → returns updated menu object | null
clearSavedMenus()         → void
```

### Current menu object shape (as stored in localStorage):

```json
{
  "id": "uuid-string",
  "restaurantName": "Trattoria Roma",
  "location": "Rome, Italy",
  "language": "Italian",
  "menu": {
    "Soups": [...dishes],
    "Salads": [...dishes],
    "Starters": [...dishes],
    "Main dishes": [...dishes],
    "Desserts": [...dishes],
    "Drinks": [...dishes]
  }
}
```

### How `process-menu` API is called (Telegram bot must match this exactly):

```js
const formData = new FormData();
formData.append('images', file);  // field name MUST be "images"

const response = await fetch('/api/process-menu', {
  method: 'POST',
  body: formData,
});
const menuData = await response.json();
// menuData = { "Soups": [...], "Salads": [...], ... }
```

---

## ENVIRONMENT VARIABLES

Add these to `.env` (the existing ones like `GEMINI_API_KEY` stay untouched):

```env
TELEGRAM_BOT_TOKEN=        # from BotFather
DATABASE_URL=              # Neon Postgres connection string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## STEP 1 — Install dependencies

```bash
npm install @neondatabase/serverless
```

Only this one package. No Telegram SDK needed — we use `fetch` directly.

---

## STEP 2 — Create `/api/menus` route

**File:** `app/api/menus/route.js`

**Neon table schema** (assume it already exists, do NOT run CREATE TABLE):

```sql
CREATE TABLE menus (
  id              TEXT PRIMARY KEY,
  saved_at        TIMESTAMP DEFAULT NOW(),
  restaurant_name TEXT,
  location        TEXT,
  language        TEXT,
  menu            JSONB
);
```

**POST** — Save a menu:
- Accept JSON body: `{ restaurantName, location, language, menu }`
- Generate `id` via `crypto.randomUUID()`
- Insert into `menus` table (map `restaurantName` → `restaurant_name` column)
- Return `{ id, restaurantName, location, language, menu }`

**GET** — List all menus:
- `SELECT * FROM menus ORDER BY saved_at DESC`
- Map each row back: `restaurant_name` → `restaurantName`
- Return JSON array

**Database connection pattern:**

```js
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
```

---

## STEP 3 — Create `/api/menus/[id]` route

**File:** `app/api/menus/[id]/route.js`

**GET** — `SELECT * FROM menus WHERE id = $1`
- Map `restaurant_name` → `restaurantName` in response
- Return 404 if not found

**PUT** — `UPDATE menus SET menu = $2 WHERE id = $1`
- Accept JSON body: `{ menu }` (the JSONB menu data)
- Return updated row (mapped)
- Return 404 if not found

**DELETE** — `DELETE FROM menus WHERE id = $1 RETURNING *`
- Return the deleted row (mapped) so the caller can clean up images
- Return 404 if not found

---

## STEP 4 — Rewrite `lib/storage.js`

**File:** `lib/storage.js`

Replace localStorage menu functions with API calls. **Keep preferences in
localStorage** — they are user-local and don't belong in the shared DB.

Critical implementation details:

1. **All menu functions become `async`.**

2. **Function mapping:**

   | Function | API call |
   |----------|----------|
   | `saveMenu(menu)` | `POST /api/menus` with menu body → return response JSON |
   | `getSavedMenus()` | `GET /api/menus` → return array |
   | `getMenuById(id)` | `GET /api/menus/${id}` → return object or `undefined` |
   | `deleteMenuById(id)` | `DELETE /api/menus/${id}` → return deleted object or `null` |
   | `updateSavedMenu(id, menuData)` | `PUT /api/menus/${id}` with `{ menu: menuData }` → return updated object or `null` |
   | `clearSavedMenus()` | `GET /api/menus` then `DELETE` each → void |

3. **Preferences functions stay exactly as they are** (localStorage).

4. Remove the `STORAGE_KEYS.SAVED_MENUS` constant (no longer used for menus).
   Keep `STORAGE_KEYS.PREFERENCES`.

---

## STEP 5 — Update `app/page.jsx` (home page)

**File:** `app/page.jsx`

Minimal changes only — the storage functions are now async, so callers need updating:

1. **Line ~199** — `getMenuById(menuId)` is now async:
   ```js
   // Before (sync):
   const savedMenu = getMenuById(menuId);

   // After (async):
   const savedMenu = await getMenuById(menuId);
   ```
   The `useEffect` callback itself can't be async, so use an inner async IIFE
   or extract to a named async function.

2. **Line ~150** — `updateSavedMenu(targetMenuId, updatedMenu)` is now async:
   - This is called inside `setMenu()` callback in the image generation flow.
   - Fire-and-forget is fine here: just call it without `await` since we don't
     need the result. But convert from sync to `updateSavedMenu(...)` → it
     returns a Promise now, which is OK to not await in this specific context.

3. **Line ~237-260** — Where `saveMenu()` is called after processing:
   - Make it async/awaited.

**Do NOT change** any UI, filtering logic, image generation logic, or component imports.

---

## STEP 6 — Update `app/saved/page.jsx`

**File:** `app/saved/page.jsx`

The key challenge: `useState(() => getSavedMenus())` is a **synchronous
initializer**, but `getSavedMenus()` is now async. Fix:

```js
// Before:
const [menus, setMenus] = useState(() => getSavedMenus());

// After:
const [menus, setMenus] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  getSavedMenus().then((data) => {
    setMenus(data);
    setLoading(false);
  });
}, []);
```

Also update:
- `deleteMenuById(menuId)` → `await deleteMenuById(menuId)`
- `clearSavedMenus()` → `await clearSavedMenus()`

Add a simple loading state (e.g., show the empty state or a spinner while
`loading` is true). Keep existing UI markup exactly the same.

---

## STEP 7 — Create Telegram webhook route

**File:** `app/api/telegram/webhook/route.js`

This route handles incoming Telegram messages via webhook.

### Logic flow:

```
1. Parse POST body from Telegram
2. Extract chat_id and message
3. If no photo → reply "Please send a menu photo 📷"
4. If photo:
   a. Reply "Processing your menu... ⏳"
   b. Get highest-res photo: message.photo[message.photo.length - 1].file_id
   c. GET https://api.telegram.org/bot{TOKEN}/getFile?file_id={file_id}
      → extract result.file_path
   d. Download image from:
      https://api.telegram.org/file/bot{TOKEN}/{file_path}
   e. Build FormData:
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('images', blob, 'menu.jpg');
   f. POST to {NEXT_PUBLIC_APP_URL}/api/process-menu with formData
   g. Take returned menu JSON
   h. POST to {NEXT_PUBLIC_APP_URL}/api/menus to save it
      Body: { restaurantName: "Telegram Upload", language: "auto", menu: menuData }
   i. Reply: "Here's your menu 👉 {NEXT_PUBLIC_APP_URL}/?menu={id}"
5. ALWAYS return Response 200 to Telegram immediately
```

### Important implementation details:

- Use `process.env.TELEGRAM_BOT_TOKEN` (server-side, no NEXT_PUBLIC_ prefix)
- Use `process.env.NEXT_PUBLIC_APP_URL` for building URLs to your own app
- Handle errors gracefully — if processing fails, send an error message to the
  user via Telegram, don't let the webhook crash
- Telegram sendMessage API:
  ```
  POST https://api.telegram.org/bot{TOKEN}/sendMessage
  Body: { chat_id, text }
  ```
- For long processing, consider responding 200 immediately and processing in
  background. In Next.js edge/serverless you can use `waitUntil` or just
  process inline since Telegram has a reasonable timeout.

---

## STEP 8 — Update `CLAUDE.md`

**File:** `CLAUDE.md` (project root)

After completing all steps, create or update `CLAUDE.md` with:

```markdown
# MenuFlow AI

## Architecture

Next.js 16 app with Gemini AI for menu scanning and dish image generation.

### Data Flow
- **Menu photos** → `/api/process-menu` (Gemini AI) → structured JSON
- **Dish images** → `/api/generate-image` (Gemini) → `/public/menu-images/`
- **Menu storage** → Neon Postgres via `/api/menus` routes
- **User preferences** → browser localStorage (not in DB)
- **Telegram** → webhook at `/api/telegram/webhook` → process-menu → save to DB → share link

### Key Files
- `lib/storage.js` — async API client for menus + localStorage for preferences
- `app/api/menus/route.js` — CRUD for menus (Neon Postgres)
- `app/api/menus/[id]/route.js` — single menu operations
- `app/api/telegram/webhook/route.js` — Telegram bot webhook
- `app/api/process-menu/route.js` — Gemini menu extraction (DO NOT MODIFY)
- `app/api/generate-image/route.js` — Gemini image generation (DO NOT MODIFY)
- `app/api/delete-menu-images/route.js` — image cleanup (DO NOT MODIFY)

### Database (Neon Postgres)
Table: `menus` (id TEXT PK, saved_at TIMESTAMP, restaurant_name TEXT, location TEXT, language TEXT, menu JSONB)

### Environment Variables
- `GEMINI_API_KEY` — Google Gemini API
- `DATABASE_URL` — Neon Postgres connection string
- `TELEGRAM_BOT_TOKEN` — Telegram bot token
- `NEXT_PUBLIC_APP_URL` — App base URL for links
- `NEXT_PUBLIC_IMAGE_GEN_RPM` — Rate limit for image generation

### DO NOT MODIFY
- Any files in `components/`
- `lib/constants.js`
- `app/profile/page.jsx`
- The three original API routes listed above
```

---

## EXECUTION ORDER

Complete steps sequentially: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.

After each step, verify the app still builds with `npm run build`.
After Step 6, test that the browser flow works end-to-end.
After Step 7, test the Telegram webhook with a curl command.
