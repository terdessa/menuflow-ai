# MenuFlow AI Repo Analysis

## What this app is

This is a Next.js app that:

1. Lets a user upload one or more menu photos.
2. Sends those photos to Gemini to extract dishes into structured JSON.
3. Saves the parsed menu in browser localStorage.
4. Optionally generates dish images with Google GenAI.
5. Lets the user filter the menu using profile preferences and per-menu filters.
6. Lets the user reopen or delete previously saved menus.

## Very simple AI workflow

1. The user uploads menu photos on the home page.
2. The frontend sends the files to `/api/process-menu`.
3. `/api/process-menu` asks Gemini to read the menu photos and return strict JSON.
4. Gemini returns dishes grouped into fixed sections, with prices, icons, and `filterProperties`.
5. The frontend saves that parsed menu in localStorage and shows the text menu immediately.
6. If images are enabled, the frontend calls `/api/generate-image` for each dish without an image.
7. `/api/generate-image` generates a PNG, saves it in `public/menu-images`, and returns the local URL.
8. As each image finishes, the frontend updates the current menu and the saved menu entry.
9. Saved menus can be reopened with `/?menu=<id>`.
10. When a saved menu is deleted, `/api/delete-menu-images` also removes its generated image files.

## Main pages and features

### Home page

- Upload one or more menu images.
- Process uploaded photos into menu data.
- Auto-save the parsed menu.
- Open a filter modal.
- Browse menu sections:
  - Soups
  - Salads
  - Starters
  - Main dishes
  - Desserts
  - Drinks
- View dish cards with:
  - dish name
  - price
  - ingredients
  - icon tags
  - optional generated image
- Reopen an existing saved menu via `/?menu=<id>`.
- Generate missing dish images in the background.

### Profile page

- Save default preferences to localStorage.
- Basic setup section.
- Advanced personalization section that can be collapsed/expanded.
- Save button with temporary saved state feedback.

### Saved page

- List all saved menus.
- Show saved date.
- Show language.
- Show total dish count.
- Open a saved menu.
- Delete one saved menu.
- Clear all saved menus.
- Delete generated image files for deleted menus.

### Shared UI behavior

- Bottom navigation with tabs:
  - Profile
  - Menu
  - Saved
- Dish icon chips.
- Progressive icon reveal animation.
- Card loading spinners for images.

## API routes

### `/api/process-menu`

Purpose:
- Takes uploaded menu photos.
- Calls Gemini text/vision extraction.
- Forces a strict JSON schema.
- Normalizes the response into fixed menu sections.

Returns per dish:
- `name`
- `ingredients`
- `price`
- `icons`
- `filterProperties`
- `imageUrl`

### `/api/generate-image`

Purpose:
- Takes a dish name, ingredients, image style, and type.
- Builds a dish-image prompt.
- Uses Google GenAI image generation.
- Saves the image locally under `public/menu-images`.
- Returns a local `imageUrl`.

### `/api/delete-menu-images`

Purpose:
- Takes an array of image URLs.
- Deletes only files under `/menu-images/`.
- Protects against unsafe path traversal.

## Saved data

Saved in browser localStorage:

- `menuflow_preferences`
- `menuflow_saved_menus`

Each saved menu includes:

- `id`
- `savedAt`
- `restaurantName`
- `location`
- `language`
- `menu`

## Menu sections

The app uses these fixed sections:

- `Soups`
- `Salads`
- `Starters`
- `Main dishes`
- `Desserts`
- `Drinks`

## Icon tags

Supported dish tags/icons:

- `vegan`
- `vegetarian`
- `pescatarian`
- `halal`
- `gluten-free`
- `sugar-free`
- `allergen-warning`
- `recommended`

## Filter properties produced by AI

The extraction route asks Gemini to produce these fields inside `filterProperties`:

- `dietTypes`
- `allergies`
- `spiceLevel`
- `alcoholType`
- `cookingStyle`
- `tasteProfile`
- `texture`
- `meatType`

## Filters and options exposed by the app

### Diet types

- `omnivore`
- `vegetarian`
- `vegan`
- `pescatarian`
- `halal`
- `gluten-free`
- `sugar-free`
- `keto`
- `paleo`
- `low-carb`

### Allergies

- `nuts`
- `gluten`
- `dairy`
- `eggs`
- `seafood`
- `soy`
- `shellfish`
- `sesame`
- `sulfites`
- `mustard`
- `celery`
- `lupin`
- `molluscs`

### Currencies

- `USD`
- `EUR`
- `GBP`
- `JPY`
- `CAD`
- `AUD`
- `CHF`
- `CNY`

### Languages

- `en`
- `es`
- `fr`
- `de`
- `it`
- `pt`
- `zh`
- `ja`
- `ko`
- `ar`
- `ru`
- `nl`
- `pl`
- `tr`
- `sv`
- `da`
- `no`
- `fi`
- `el`
- `he`

### Spice tolerance

- `none`
- `mild`
- `medium`
- `hot`
- `very-hot`

### Alcohol types

- `wine`
- `beer`
- `cocktail`
- `prosecco`
- `spirits`
- `champagne`
- `sake`
- `cider`

### Image styles

- `minimalistic`
- `simple`
- `detailed`

### Image categories

- `starters`
- `mains`
- `desserts`
- `drinks`
- `soups`
- `salads`

### Speed preferences

- `quick`
- `normal`
- `long-okay`

### Texture preferences

- `crispy`
- `soft`
- `creamy`
- `crunchy`
- `tender`
- `smooth`
- `chewy`
- `flaky`

### Cooking styles

- `grilled`
- `fried`
- `baked`
- `raw`
- `steamed`
- `roasted`
- `boiled`
- `sauteed`
- `braised`
- `smoked`

### Portion sharing

- `alone`
- `2`
- `3`
- `4`
- `5`
- `6+`

### Taste preferences

- `sweet`
- `savoury`
- `salty`
- `sour`
- `bitter`
- `umami`
- `spicy`
- `tangy`

### Meat preferences

- `chicken`
- `beef`
- `pork`
- `lamb`
- `turkey`
- `duck`
- `seafood`
- `fish`

### Free-text options

- custom diet types
- custom allergies
- liked ingredients
- disliked ingredients
- exclude ingredients
- custom instructions

## What is actually applied right now

These filters are actually used by `filterMenu()` on the home page:

- diet types
- allergies
- excluded ingredients
- spice tolerance
- alcohol enabled
- alcohol types
- cooking styles
- taste preferences
- texture preferences
- meat preferences

## Options that exist but are not fully used yet

These options are captured in UI or saved preferences, but are not fully wired into filtering or AI requests:

- language
  - the AI extraction route still hardcodes translation to English
- currency
  - only changes the displayed symbol, not the actual numeric price
- image categories
  - collected in UI, but current image generation does not filter by selected categories
- speed preference
- portion sharing
- custom instructions
- custom diet types
- custom allergies
- liked ingredients
- `showImages`
  - internal state exists, but there is no visible toggle wired to it

Disliked ingredients are partially used:

- They are saved in profile.
- On the home page they are converted into `excludeIngredients`.
- Then filtering uses that exclude list.

## Important implementation notes

- Menu extraction currently ignores saved profile preferences when calling `/api/process-menu`.
- The upload flow sends only images, not profile context.
- The extraction route always targets English.
- Image generation runs dish-by-dish from the client, with simple spacing based on `NEXT_PUBLIC_IMAGE_GEN_RPM`.
- Saved menus and preferences are browser-local only. There is no database or user auth.
- Generated images are stored on local disk under `public/menu-images`.

## 10 possible optimization ideas

1. Pass profile preferences into `/api/process-menu` so Gemini can tailor extraction, recommendation tags, and translation in one request instead of relying mostly on client-side filtering later.
2. Use the selected profile language in the extraction prompt instead of hardcoding English.
3. Respect `imageCategories` before generating images so the app does not spend time and tokens on every dish.
4. Cache generated images by a stable hash of `dishName + ingredients + style + type` instead of always creating a new random filename.
5. Batch or queue image generation server-side instead of launching many client fetches with `setTimeout`, which adds client overhead and fragile retry behavior.
6. Skip image generation for dishes outside the currently visible section or generate only on demand when cards scroll into view.
7. Memoize or precompute normalized filter fields per dish after extraction so filtering large menus does less repeated string work on every UI change.
8. Remove the progressive icon interval animation or make it optional for large menus, because dozens of timers can add avoidable UI work.
9. Store extracted raw AI output plus normalized output so reprocessing/debugging does not require another expensive AI call.
10. Move saved menus from localStorage to a backend or indexed storage layer if menu sizes grow, because repeated full JSON reads/writes can become slow as more menus and images accumulate.

## Key code references

- Home page and filter logic: `app/app/page.jsx`
- Profile preferences UI: `app/app/profile/page.jsx`
- Saved menus UI: `app/app/saved/page.jsx`
- Filter modal: `app/components/FilterPanel.jsx`
- Dish card rendering: `app/components/MenuCard.jsx`
- Dish tag rendering: `app/components/DishIcon.jsx`
- Progressive icon loading: `app/components/ProgressiveIcons.jsx`
- Extraction route: `app/app/api/process-menu/route.js`
- Image generation route: `app/app/api/generate-image/route.js`
- Image cleanup route: `app/app/api/delete-menu-images/route.js`
- App constants: `app/lib/constants.js`
- Local storage helpers: `app/lib/storage.js`
