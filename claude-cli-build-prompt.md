# Claude CLI Build Prompt — "Once Upon" (MERN / Next.js) — paste into Claude Code

> Paste everything below the line into Claude Code. It will scaffold and build the app.
> Keep `once-upon-app.html` in the repo root as the visual/flow reference.

---

Build me a production **MERN-stack** web app called **Once Upon** — a personalized children's
storybook generator. A parent answers a short guided interview about their child; we generate a
fully personalized, fully illustrated **~30 page** storybook; they preview it, pay, and we generate
all the illustrations, assemble a print-ready PDF, and ship a printed book via print-on-demand.

Use `once-upon-app.html` (in the repo root) as the exact reference for the look, copy, screens,
and the 6-step guided interview. Match its warm storybook aesthetic.

## Stack (MERN with Next.js)
- **M** — MongoDB Atlas, accessed via **Mongoose**-
- **E** — Express layer: use **Next.js App Router API routes** as the Node/Express server (don't
  spin up a separate Express process). If I later want a standalone Express server, keep the route
  handlers thin so they can be lifted into Express controllers with minimal change.
- **R** — React via **Next.js (App Router) + TypeScript + Tailwind**
- **N** — Node (the Next.js runtime)
- Auth: **JWT + bcrypt**, token stored in an httpOnly secure cookie (true MERN auth; no third party)
- File storage: **Cloudinary** for generated images and PDFs (or AWS S3 if preferred)
- Payments: **Stripe** Checkout + webhooks
- Story text: **Anthropic Claude API** (`claude-sonnet-4-6`) — server-side only
- Images: an image model with **character consistency** (see below) — server-side only
- Print-on-demand: **Gelato API**
- Deploy on Vercel (MongoDB Atlas + Cloudinary are managed externally)

## Environment variables (.env.local, gitignored — never expose to the browser)
MONGODB_URI, JWT_SECRET, ANTHROPIC_API_KEY, IMAGE_API_KEY,
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
GELATO_API_KEY, APP_URL.

## Screens (mirror the HTML)
Landing, Sign in / Sign up, Dashboard (user's books + "Create" CTA), Create wizard (6 steps),
Book reader (`/book/[id]`), Checkout. Gate dashboard, create, checkout, and full book behind auth
(check the JWT cookie in middleware).

## Guided interview (6 steps) — collect:
1. Child name (required) + age (2–8)
2. Look: hair color, skin tone, outfit color (hex)
3. What they love (required, free text)
4. Value to celebrate (Bravery / Kindness / Curiosity / Friendship / Never giving up / Believing in yourself)
5. World (Under the sea / Outer space / Magic forest / Faraway castle / Dino world / Big city) + mood (Magical / Funny / Cozy / Big adventure)
6. Dedication (optional) + review

## Mongoose models
```js
// User
{ email: {type:String, unique:true, required:true}, name:String,
  passwordHash:String, createdAt:{type:Date, default:Date.now} }

// Book  (pages embedded as subdocuments)
{ userId:{type:ObjectId, ref:'User', index:true},
  title:String, dedication:String,
  child:{ name:String, age:Number, hairColor:String, skinTone:String, outfitColor:String },
  loves:String, value:String, world:String, tone:String,
  characterSheet:String, artStyle:String,
  status:{type:String, default:'preview'},   // preview | paid | generating_art | complete | error
  format:String, coverUrl:String, pdfUrl:String,
  pages:[{ pageNumber:Number, text:String, setting:String, time:String,
           imagePrompt:String, imageUrl:String }],
  createdAt:{type:Date, default:Date.now} }

// Order
{ bookId:{type:ObjectId, ref:'Book'}, userId:{type:ObjectId, ref:'User'},
  format:String, amountCents:Number, stripeSessionId:String, gelatoOrderId:String,
  status:{type:String, default:'pending'},    // pending | paid | printing | shipped | fulfilled
  shippingAddress:Object, createdAt:{type:Date, default:Date.now} }
```
Use a singleton Mongoose connection helper (cache the connection across hot reloads / serverless invocations).

## Auth (JWT + bcrypt)
Routes: `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
Hash passwords with bcrypt; sign a JWT on login/signup; set it as an httpOnly, secure, sameSite=lax
cookie. Protect API routes and pages by verifying the cookie. Users only access their own books/orders.

## Story generation — ~30 pages, CHUNKED
Generate in chunks to avoid truncation: ask Claude for pages in batches of ~12–15, then stitch into
one book. The first call also returns `title`, `dedication`, a locked `characterSheet` (detailed
fixed physical description of the hero), and an `artStyle` string. Later calls receive the
characterSheet + artStyle + a short story-so-far summary and continue the arc.

System prompt for each call (server-side):
"You are a master children's picture-book author writing a premium personalized hardcover. The
child is the hero on every page. Warm, wholesome, strictly age-appropriate — nothing scary, violent,
sexual, or adult. Match vocabulary to the age. Across the whole ~30 page book build a satisfying arc:
setup, call to adventure, rising discovery, a challenge tied to the chosen value, a brave/kind
resolution, cozy ending. Weave in what the child loves. 1–3 short sentences per page. Reuse the given
characterSheet VERBATIM at the start of every page's imagePrompt. Return ONLY JSON:
{title, dedication, characterSheet, artStyle, pages:[{pageNumber, text, setting, time, imagePrompt}]}."
Set max_tokens high (e.g. 4096) per call. Validate/repair JSON; retry any truncated chunk. Add a
moderation check on the free-text "loves" field; refuse inappropriate content gracefully.

## Image generation — GENERATE EVERY PAGE, with character consistency (the moat)
Required: after payment, generate an illustration for ALL ~30 pages, not just some.
1. Generate ONE hero reference image from the characterSheet on a clean background.
2. For each page, call the image model with that reference image as a character/style reference
   (image-to-image / IP-Adapter / reference-image feature) + the page's imagePrompt + the same
   artStyle string + a fixed seed — so the child looks identical on every page.
3. Recommended models (keep IMAGE_API_KEY generic): Flux (via fal.ai or Replicate) with reference
   image, Google Gemini 2.5 Flash Image ("nano-banana", strong at character consistency), or GPT Image
   with the reference/edit flow.
4. Validation pass; regenerate any page where the hero drifts.
5. Upload every image to Cloudinary; save imageUrl per page. Generate concurrently in small batches
   (e.g. 4 at a time) for speed.

## Cost control (important)
Generate ONLY the cover image before payment (preview). Generate the remaining ~29 images ONLY after
Stripe confirms payment, triggered from the webhook. Pre-purchase cost stays ~$0.05. Rate-limit free
previews to 3/day per account.

## Payments + pricing
Stripe Checkout. Prices: Digital PDF $19 (1900), Softcover+PDF $34 (3400), Hardcover+PDF $49 (4900).
On `checkout.session.completed` webhook: mark order paid → set book status generating_art → run full
image generation → assemble PDF → for physical formats create a Gelato order with interior + cover
PDFs and the Stripe-collected shipping address. Update order status from Gelato webhooks.

## Print-ready PDF
Render pages (reuse the reader layout) to PDF via Puppeteer (or pdf-lib). Square trim (8.5x8.5in),
0.125in bleed on full-bleed art, 300 DPI, separate cover PDF from interior PDF (Gelato requires this).
Upload the PDFs to Cloudinary and save pdfUrl on the book.

## API routes summary
`/api/auth/*` (signup, login, logout, me), `/api/generate-story`, `/api/generate-cover`,
`/api/checkout`, `/api/stripe-webhook`, `/api/books` (list mine), `/api/books/[id]` (get mine).

## Build order
1. Next.js + Tailwind + Mongoose connection + JWT auth. Port landing + dashboard + 6-step wizard from the HTML.
2. /api/generate-story (chunked ~30 pages) + reader showing text with cover + locked pages.
3. /api/generate-cover (single image) for the preview.
4. Stripe Checkout + webhook; status flip on paid.
5. Post-payment FULL image generation for every page with reference-image consistency → Cloudinary.
6. PDF assembly → Cloudinary.
7. Gelato fulfillment for physical formats.
8. Moderation + preview rate limit + polish.
Ship steps 1–4 first as a working buyable PDF flow, then add full art + print.

Confirm the plan, then start building, asking me for any keys/decisions you need as you go.
