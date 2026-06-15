/**
 * Image generation via fal.ai with character consistency:
 * 1. generateHeroReference() — one clean reference image from the characterSheet
 * 2. generatePageImage() — image-to-image with the reference + page prompt + fixed seed
 *
 * Provider is isolated here so it can be swapped (Replicate, Gemini image, etc.)
 * without touching callers.
 */

const FAL_KEY = process.env.FAL_KEY || process.env.IMAGE_API_KEY;
const TXT2IMG_MODEL = process.env.FAL_TEXT_TO_IMAGE_MODEL || "fal-ai/nano-banana";
const EDIT_MODEL = process.env.FAL_IMAGE_EDIT_MODEL || "fal-ai/nano-banana/edit";
const FAL_RUN_URL = "https://fal.run";
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 110_000;

interface FalImageResult {
  images?: { url: string }[];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function falRun(model: string, input: Record<string, unknown>): Promise<string> {
  if (!FAL_KEY) throw new Error("FAL_KEY is not set");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${FAL_RUN_URL}/${model}`, {
        method: "POST",
        headers: {
          Authorization: `Key ${FAL_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!res.ok) {
        const body = await res.text();
        const retryable = res.status === 408 || res.status === 429 || res.status >= 500;
        if (retryable && attempt < MAX_ATTEMPTS) {
          await sleep(1_000 * 2 ** (attempt - 1));
          continue;
        }
        throw new Error(`fal.ai error ${res.status}: ${body.slice(0, 500)}`);
      }

      const data = (await res.json()) as FalImageResult;
      const out = data.images?.[0]?.url;
      if (!out) throw new Error("fal.ai returned no image");
      return out;
    } catch (err) {
      const retryable =
        err instanceof TypeError || (err instanceof DOMException && err.name === "TimeoutError");
      if (!retryable || attempt === MAX_ATTEMPTS) throw err;
      await sleep(1_000 * 2 ** (attempt - 1));
    }
  }

  throw new Error("fal.ai request failed");
}

/** One hero reference image on a clean background. */
export async function generateHeroReference(characterSheet: string, artStyle: string): Promise<string> {
  return falRun(TXT2IMG_MODEL, {
    prompt: `${characterSheet}. ${artStyle}. Full body character reference of one child, standing, friendly neutral pose, plain warm cream background, children's picture book illustration.`,
    num_images: 1,
    aspect_ratio: "4:5",
    output_format: "png",
    safety_tolerance: "2",
    limit_generations: true,
  });
}

/** Development preview for quickly evaluating the configured text-to-image model. */
export async function generateTestImage(prompt: string): Promise<string> {
  return falRun(TXT2IMG_MODEL, {
    prompt,
    num_images: 1,
    aspect_ratio: "4:5",
    output_format: "png",
    safety_tolerance: "2",
    limit_generations: true,
  });
}

/** One page illustration using the hero reference for consistency. */
export async function generatePageImage(
  referenceUrl: string,
  characterSheet: string,
  artStyle: string,
  imagePrompt: string
): Promise<string> {
  return falRun(EDIT_MODEL, {
    image_urls: [referenceUrl],
    prompt: `Use the child in the reference image as the same recurring hero. Preserve this character exactly: ${characterSheet}. Keep their face, hair, skin tone, outfit, and proportions consistent. New scene: ${imagePrompt}. ${artStyle}. Children's picture book illustration, full-bleed portrait scene. Keep all faces, characters, and important story objects in the upper 70% of the composition. Reserve the lower 30% as a calm, low-detail area with no faces, hands, text, letters, labels, logos, or essential objects so readable story text can be overlaid there.`,
    num_images: 1,
    aspect_ratio: "4:5",
    output_format: "png",
    safety_tolerance: "2",
    limit_generations: true,
  });
}

/** The book cover: hero front and center, title space at the bottom. */
export async function generateCoverImage(
  characterSheet: string,
  artStyle: string,
  world: string,
  title: string
): Promise<string> {
  return falRun(TXT2IMG_MODEL, {
    prompt: `${characterSheet}. ${artStyle}. Book cover illustration: the child hero front and center in ${world}, joyful, magical lighting, space at the bottom for the title "${title}". Children's picture book cover, full-bleed.`,
    num_images: 1,
    aspect_ratio: "4:5",
    output_format: "png",
    safety_tolerance: "2",
    limit_generations: true,
  });
}
