# MenuFlow AI

MenuFlow AI is a Next.js app for scanning restaurant menus, extracting structured dishes with Gemini, applying allergen-focused filters, and saving menus locally for later review.

## Development

```bash
npm install
npm run dev
```

The app expects `GEMINI_API_KEY` for menu extraction. Image generation uses `NANOBANANA_API_KEY` when available and falls back to `GEMINI_API_KEY`.
