# MenuFlow AI Greenfield TODO

This TODO assumes the product has not been built yet. It is based on the current project scope implied by the codebase.

## Product Goal

Build a web app that lets users upload restaurant menu photos, extract structured dishes with AI, personalize results around dietary needs and preferences, optionally generate dish images, and save menus for later viewing.

## Phase 1: Foundation

- [ ] Confirm product name, positioning, and target user story for travelers/diners reading unfamiliar menus.
- [ ] Define the core user flow: set preferences, upload menu photos, review extracted dishes, filter results, save menu, reopen later.
- [ ] Create a Next.js app with App Router, React, Tailwind CSS, and linting.
- [ ] Set up project structure for `app`, `components`, `lib`, and API routes.
- [ ] Define environment variable strategy for AI providers and image generation settings.
- [ ] Add a basic README with setup, required env vars, and local development instructions.

## Phase 2: Data Model and Constants

- [ ] Define canonical menu sections: `Soups`, `Salads`, `Starters`, `Main dishes`, `Desserts`, `Drinks`.
- [ ] Define a normalized dish schema with `name`, `ingredients`, `price`, `icons`, `filterProperties`, and `imageUrl`.
- [ ] Define shared constants for diet types, allergies, currencies, languages, spice levels, alcohol types, image styles, dish categories, textures, cooking styles, taste preferences, meat preferences, and portion sizes.
- [ ] Decide which preference fields are user defaults versus per-menu filters.
- [ ] Document how AI output should be normalized when sections or fields are missing.

## Phase 3: Preferences and Local Persistence

- [ ] Build client-side storage utilities for user preferences and saved menus.
- [ ] Add helpers to create, read, update, and delete saved menus.
- [ ] Persist profile preferences in local storage.
- [ ] Persist scanned menus in local storage with IDs and timestamps.
- [ ] Handle malformed local storage data safely.

## Phase 4: Profile / Preferences Experience

- [ ] Build a profile screen for default dining preferences.
- [ ] Add selectable diet and lifestyle options.
- [ ] Add allergy selection plus free-text custom allergies.
- [ ] Add liked/disliked ingredient inputs.
- [ ] Add home currency and preferred language selectors.
- [ ] Add spice tolerance controls.
- [ ] Add advanced personalization for alcohol, image generation, speed, cooking styles, texture, taste, meat preferences, portion sharing, and custom instructions.
- [ ] Add a save action with clear confirmation state.

## Phase 5: Menu Upload Flow

- [ ] Build a homepage with an upload-first empty state.
- [ ] Support uploading one or more menu photos.
- [ ] Restrict file input to images.
- [ ] Show upload and processing states.
- [ ] Reset prior menu state when a new upload starts.
- [ ] Decide whether drag-and-drop is in scope or deferred.

## Phase 6: AI Menu Extraction API

- [ ] Add a server route to receive uploaded menu images as multipart form data.
- [ ] Validate presence of at least one image.
- [ ] Integrate a multimodal model to analyze menu photos.
- [ ] Write a prompt that extracts dishes into the canonical section schema.
- [ ] Require translated output in a target language while preserving meaning.
- [ ] Extract structured filter metadata such as diet types, allergens, spice level, alcohol type, cooking style, taste profile, texture, and meat type.
- [ ] Normalize model output into a stable JSON shape.
- [ ] Strip code fences or other wrapper text from model responses before parsing.
- [ ] Add robust error handling for invalid JSON and provider failures.
- [ ] Return normalized menu data to the client.

## Phase 7: Menu Rendering

- [ ] Render extracted menu sections on the homepage after upload completes.
- [ ] Hide empty sections.
- [ ] Build reusable dish cards showing image, dish name, ingredients, icons, and price.
- [ ] Add loading placeholders for dish images.
- [ ] Format prices using the selected currency symbol.
- [ ] Preserve responsive behavior across mobile, tablet, and desktop.

## Phase 8: Filtering and Personalization

- [ ] Build a filter panel modal or drawer.
- [ ] Initialize filters from saved user preferences.
- [ ] Support filtering by diet type, allergies, excluded ingredients, currency, language, spice tolerance, alcohol preferences, image options, speed preference, texture, cooking style, portion sharing, taste profile, meat preference, and custom instructions.
- [ ] Add reset behavior that restores defaults from saved preferences.
- [ ] Implement menu filtering logic against dish `filterProperties`.
- [ ] Keep backward compatibility if icons must be used as a fallback for some diet filters.
- [ ] Decide how custom diet and allergy free-text entries should affect filtering versus prompting.

## Phase 9: Image Generation

- [ ] Add a server route to generate dish images from dish metadata.
- [ ] Choose the image model and define required env vars.
- [ ] Create prompts that distinguish between food dishes and drinks.
- [ ] Support multiple image styles such as minimalistic, simple, and detailed.
- [ ] Save generated images under a public directory with safe filenames.
- [ ] Return a public URL for each generated image.
- [ ] Generate missing images asynchronously after menu extraction succeeds.
- [ ] Update dish cards incrementally as each image becomes available.
- [ ] Add rate limiting / spacing between image generation requests.
- [ ] Persist updated image URLs back into saved menus.
- [ ] Handle image generation failures without breaking menu viewing.

## Phase 10: Saved Menus

- [ ] Build a saved menus screen listing previously scanned menus.
- [ ] Show restaurant name, location, saved date, language, and dish count.
- [ ] Allow reopening a saved menu from the homepage via query param or route state.
- [ ] Allow deleting individual saved menus.
- [ ] Allow clearing all saved menus.
- [ ] Decide whether menu metadata like restaurant name and location should be extracted automatically or editable by the user.

## Phase 11: Image Cleanup

- [ ] Add a server route to delete generated menu images safely.
- [ ] Only allow deletion of files within the menu image directory.
- [ ] Trigger cleanup when deleting a saved menu.
- [ ] Trigger cleanup when clearing all saved menus.
- [ ] Return detailed deletion results for deleted, missing, and skipped files.

## Phase 12: Navigation and UX Polish

- [ ] Add bottom navigation between Profile, Menu, and Saved screens.
- [ ] Define app-wide metadata, title, and description.
- [ ] Establish global theme tokens for background, text, borders, cards, and brand colors.
- [ ] Add smooth transitions and subtle loading animations.
- [ ] Improve empty states, error states, and retry behavior.
- [ ] Ensure accessibility for buttons, inputs, labels, and modal close actions.

## Phase 13: Reliability and Edge Cases

- [ ] Handle menus with partial OCR quality or ambiguous section names.
- [ ] Handle dishes with missing prices or ingredients.
- [ ] Handle image generation being disabled by user preference.
- [ ] Handle reopening saved menus where some images are still missing.
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
