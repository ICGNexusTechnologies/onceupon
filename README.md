# Once Upon

Next.js app for personalized storybook generation, checkout, gift cards, admin operations, and Gelato fulfillment.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Checks

```bash
npm test
npx tsc --noEmit
npm run build
```

## Required Environment

Copy `.env.example` to `.env.local` and set real values. Never commit production secrets.

Core:
- `MONGODB_URI`
- `JWT_SECRET`
- `APP_URL`
- `ADMIN_EMAILS`

Story and image generation:
- `ANTHROPIC_API_KEY`
- `FAL_KEY` or `IMAGE_API_KEY`
- Optional: `FAL_TEXT_TO_IMAGE_MODEL`, `FAL_IMAGE_EDIT_MODEL`, `FAL_UPSCALE_MODEL`

Storage and media:
- `BLOB_READ_WRITE_TOKEN` or Vercel Blob OIDC variables
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Payments:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Email:
- `RESEND_API_KEY`
- `EMAIL_FROM`

Fulfillment:
- `GELATO_ENABLED`
- `GELATO_API_KEY`
- `GELATO_ORDER_TYPE`
- `GELATO_SOFTCOVER_UID`
- `GELATO_HARDCOVER_UID`
- `GELATO_WEBHOOK_SECRET`
- `CRON_SECRET`

Rate limiting:
- Optional but recommended in production: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

## Security Notes

- Stripe webhooks require signature verification and are deduped by Stripe event ID.
- Gelato webhook and cron endpoints fail closed in production when their shared secrets are not configured.
- Gift card redemption uses atomic Mongo updates; partial Stripe checkouts reserve a card for one hour and finalize only for the matching Stripe session.
- Session JWTs last 30 days. Revocation through `sessionsValidAfter` is best-effort during MongoDB outages by design; see `lib/auth.ts`.
