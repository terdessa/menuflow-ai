# MenuFlow AI

MenuFlow AI is a Next.js app for scanning restaurant menus, extracting structured dishes with Gemini, applying allergen-focused filters, and publishing each generated menu to a shareable public page.

## Development

```bash
npm install
npm run dev
```

Create a local env file first:

```bash
cp .env.example .env.local
```

## Environment Variables

The app expects:

- `GEMINI_API_KEY` for menu extraction
- `GEMINI_MODEL` optional override for the primary extraction model
- `GEMINI_FALLBACK_MODELS` optional comma-separated fallback models for extraction retries
- `NANOBANANA_API_KEY` optional image generation key, falling back to `GEMINI_API_KEY`
- `NANOBANANA_MODEL` optional image generation model override
- `UPSTASH_REDIS_REST_URL` for the live menu datastore
- `UPSTASH_REDIS_REST_TOKEN` for the live menu datastore

Image generation uses `NANOBANANA_API_KEY` when available and falls back to `GEMINI_API_KEY`.

## Public Menus

Each saved menu now gets a public route at `/menu/:id`, so it can be opened and shared directly.

## Upstash Redis Setup

1. Create a Redis database in Upstash.
2. Open the database details page.
3. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Put both values into your local `.env.local`.

## Vercel Deployment

1. Push the repository to GitHub.
2. Import the repo into Vercel.
3. In the Vercel project settings, add these environment variables:
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL`
   - `GEMINI_FALLBACK_MODELS`
   - `NANOBANANA_API_KEY`
   - `NANOBANANA_MODEL`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `NEXT_PUBLIC_IMAGE_GEN_RPM`
4. Redeploy after saving the env vars.

## Notes

- Saved menus and shareable menu pages now use Upstash Redis as the live datastore.
- Generated dish images are stored inside the saved menu payload, so public menu pages render directly from DB-backed menu data.
- This works for deployment, but storing large base64 images in Redis is not the most efficient long-term design. Object storage would be a better next step if image volume grows.
