/**
 * Curated illustration styles the buyer chooses from during book creation.
 * The `prompt` sentence is injected into every image generation (hero, pages,
 * cover) so the whole book stays in one consistent, on-brand style.
 *
 * Single source of truth: the create wizard renders these, and the
 * generate-story route resolves a chosen `key` to its `prompt` server-side
 * (never trusting a free-form style string from the client).
 */
export interface ArtStyle {
  key: string;
  label: string;
  emoji: string;
  description: string;
  prompt: string;
}

export const ART_STYLES: ArtStyle[] = [
  {
    key: "watercolor",
    label: "Soft Watercolor",
    emoji: "🎨",
    description: "Gentle washes and warm, cozy colors",
    prompt:
      "Soft watercolor children's picture-book illustration, gentle washes, warm cozy palette, subtle paper texture, hand-painted feel.",
  },
  {
    key: "storybook",
    label: "Classic Storybook",
    emoji: "📖",
    description: "Rich, painterly, timeless fairy-tale look",
    prompt:
      "Classic hand-painted storybook illustration, rich detail, painterly textures, warm lighting, timeless fairy-tale feel.",
  },
  {
    key: "cartoon",
    label: "Playful Cartoon",
    emoji: "🌈",
    description: "Bold outlines and bright, fun colors",
    prompt:
      "Bright playful cartoon illustration, bold clean outlines, vivid saturated colors, cheerful and fun, flat shading.",
  },
  {
    key: "papercut",
    label: "Paper Cut-Out",
    emoji: "✂️",
    description: "Layered paper collage with soft shadows",
    prompt:
      "Layered paper-cut collage illustration, flat crafted shapes, soft drop shadows, handmade construction-paper look.",
  },
  {
    key: "crayon",
    label: "Crayon & Pencil",
    emoji: "🖍️",
    description: "Soft hand-drawn, childlike charm",
    prompt:
      "Hand-drawn crayon and colored-pencil illustration, soft strokes, gentle textures, whimsical childlike charm.",
  },
  {
    key: "dreamy3d",
    label: "Dreamy 3D",
    emoji: "✨",
    description: "Soft rounded characters, gentle lighting",
    prompt:
      "Soft 3D rendered illustration, rounded friendly characters, gentle warm lighting, smooth surfaces, cozy and modern.",
  },
];

export const DEFAULT_ART_STYLE = ART_STYLES[0];

/** Resolve a style key to its prompt sentence. Falls back to the default. */
export function resolveArtStyle(key: string | undefined): string {
  return (ART_STYLES.find((s) => s.key === key) ?? DEFAULT_ART_STYLE).prompt;
}
