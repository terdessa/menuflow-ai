# MenuFlow AI Greenfield TODO

This TODO assumes the product has not been built yet. It is based on the current project scope implied by the codebase.

## Product Goal

Build a web app that lets users upload restaurant menu photos, extract structured dishes with AI, personalize results around dietary needs and preferences, optionally generate dish images, and save menus for later viewing.

## Phase 1: Foundation

- [x] Confirm product name, positioning, and target user story for travelers/diners reading unfamiliar menus.
- [x] Define the core user flow: set preferences, upload menu photos, review extracted dishes, filter results, save menu, reopen later.
- [x] Create a Next.js app with App Router, React, Tailwind CSS, and linting.
- [x] Set up project structure for `app`, `components`, `lib`, and API routes.
- [x] Define environment variable strategy for AI providers and image generation settings.
- [x] Add a basic README with setup, required env vars, and local development instructions.

## Phase 2: Data Model and Constants

- [x] Define canonical menu sections: `Soups`, `Salads`, `Starters`, `Main dishes`, `Desserts`, `Drinks`.
- [x] Define a normalized dish schema with `name`, `ingredients`, `price`, `icons`, `filterProperties`, and `imageUrl`.
- [x] Define shared constants for diet types, allergies, currencies, languages, spice levels, alcohol types, image styles, dish categories, textures, cooking styles, taste preferences, meat preferences, and portion sizes.
- [ ] Decide which preference fields are user defaults versus per-menu filters.
- [ ] Document how AI output should be normalized when sections or fields are missing.

## Phase 3: Preferences and Local Persistence

- [x] Build client-side storage utilities for user preferences and saved menus.
- [x] Add helpers to create, read, update, and delete saved menus.
- [x] Persist profile preferences in local storage.
- [ ] Persist scanned menus in local storage with IDs and timestamps.
- [x] Handle malformed local storage data safely.

## Phase 4: Profile / Preferences Experience

- [x] Build a profile screen for default dining preferences.
- [x] Add selectable diet and lifestyle options.
- [x] Add allergy selection plus free-text custom allergies.
- [x] Add liked/disliked ingredient inputs.
- [x] Add home currency and preferred language selectors.
- [x] Add spice tolerance controls.
- [x] Add advanced personalization for alcohol, image generation, speed, cooking styles, texture, taste, meat preferences, portion sharing, and custom instructions.
- [x] Add a save action with clear confirmation state.

## Phase 5: Menu Upload Flow

- [x] Build a homepage with an upload-first empty state.
- [x] Support uploading one or more menu photos.
- [x] Restrict file input to images.
- [x] Show upload and processing states.
- [x] Reset prior menu state when a new upload starts.
- [ ] Decide whether drag-and-drop is in scope or deferred.

## Phase 6: AI Menu Extraction API

- [x] Add a server route to receive uploaded menu images as multipart form data.
- [x] Validate presence of at least one image.
- [x] Integrate a multimodal model to analyze menu photos.
- [x] Write a prompt that extracts dishes into the canonical section schema.
- [ ] Require translated output in a target language while preserving meaning.
- [x] Extract structured filter metadata such as diet types, allergens, spice level, alcohol type, cooking style, taste profile, texture, and meat type.
- [x] Normalize model output into a stable JSON shape.
- [x] Strip code fences or other wrapper text from model responses before parsing.
- [x] Add robust error handling for invalid JSON and provider failures.
- [x] Return normalized menu data to the client.

## Phase 7: Menu Rendering

- [x] Render extracted menu sections on the homepage after upload completes.
- [x] Hide empty sections.
- [x] Build reusable dish cards showing image, dish name, ingredients, icons, and price.
- [x] Add loading placeholders for dish images.
- [x] Format prices using the selected currency symbol.
- [x] Preserve responsive behavior across mobile, tablet, and desktop.

## Phase 8: Filtering and Personalization

- [x] Build a filter panel modal or drawer.
- [x] Initialize filters from saved user preferences.
- [ ] Support filtering by diet type, allergies, excluded ingredients, currency, language, spice tolerance, alcohol preferences, image options, speed preference, texture, cooking style, portion sharing, taste profile, meat preference, and custom instructions.
- [x] Add reset behavior that restores defaults from saved preferences.
- [x] Implement menu filtering logic against dish `filterProperties`.
- [x] Keep backward compatibility if icons must be used as a fallback for some diet filters.
- [ ] Decide how custom diet and allergy free-text entries should affect filtering versus prompting.

## Phase 9: Image Generation

- [x] Add a server route to generate dish images from dish metadata.
- [x] Choose the image model and define required env vars.
- [x] Create prompts that distinguish between food dishes and drinks.
- [x] Support multiple image styles such as minimalistic, simple, and detailed.
- [x] Save generated images under a public directory with safe filenames.
- [x] Return a public URL for each generated image.
- [x] Generate missing images asynchronously after menu extraction succeeds.
- [x] Update dish cards incrementally as each image becomes available.
- [x] Add rate limiting / spacing between image generation requests.
- [x] Persist updated image URLs back into saved menus.
- [x] Handle image generation failures without breaking menu viewing.

## Phase 10: Saved Menus

- [x] Build a saved menus screen listing previously scanned menus.
- [ ] Show restaurant name, location, saved date, language, and dish count.
- [x] Allow reopening a saved menu from the homepage via query param or route state.
- [x] Allow deleting individual saved menus.
- [x] Allow clearing all saved menus.
- [ ] Decide whether menu metadata like restaurant name and location should be extracted automatically or editable by the user.

## Phase 11: Image Cleanup

- [x] Add a server route to delete generated menu images safely.
- [x] Only allow deletion of files within the menu image directory.
- [x] Trigger cleanup when deleting a saved menu.
- [x] Trigger cleanup when clearing all saved menus.
- [x] Return detailed deletion results for deleted, missing, and skipped files.

## Phase 12: Navigation and UX Polish

- [x] Add bottom navigation between Profile, Menu, and Saved screens.
- [x] Define app-wide metadata, title, and description.
- [x] Establish global theme tokens for background, text, borders, cards, and brand colors.
- [x] Add smooth transitions and subtle loading animations.
- [x] Improve empty states, error states, and retry behavior.
- [x] Ensure accessibility for buttons, inputs, labels, and modal close actions.

## Phase 13: Reliability and Edge Cases

- [ ] Handle menus with partial OCR quality or ambiguous section names.
- [x] Handle dishes with missing prices or ingredients.
- [x] Handle image generation being disabled by user preference.
- [x] Handle reopening saved menus where some images are still missing.
- [ ] Prevent crashes when browser storage is unavailable or corrupted.
- [ ] Decide whether menus should sync across devices or remain local-only in v1.

## Phase 14: Testing

- [ ] Add unit tests for storage helpers.
- [ ] Add tests for menu normalization and filtering logic.
- [ ] Add API route tests for validation and failure cases.
- [ ] Add UI tests for upload flow, filter interactions, saved menus, and navigation.
- [ ] Add manual test cases for multiple menu photos and long-running image generation.

## Phase 15: Launch Readiness

- [ ] Document required environment variables: menu parsing model, image model, API keys, and image generation rate limit.
- [ ] Add production-safe logging and error reporting.
- [ ] Review file-system assumptions for deployment targets.
- [ ] Confirm whether generated images should live on local disk, object storage, or CDN.
- [ ] Add deployment instructions and hosting notes.
- [ ] Define a post-launch backlog for accounts, cloud sync, restaurant metadata extraction, and stronger structured validation.

## Nice-to-Have Backlog

- [ ] Add drag-and-drop uploads.
- [ ] Add editable menu items after extraction.
- [ ] Add restaurant name and location extraction from menu photos.
- [ ] Add currency conversion instead of symbol-only display.
- [ ] Add multilingual output based on the user's selected language.
- [ ] Add cloud persistence and user accounts.
- [ ] Add sharing/export for saved menus.
- [ ] Add confidence scores for extracted dishes and allergens.
