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
      "Soft watercolor children's picture-book illustration, delicate translucent washes, layered wet-on-wet blooms, warm cozy palette, subtle cold-press paper texture, gentle diffused lighting, hand-painted artisan feel.",
  },
  {
    key: "storybook",
    label: "Classic Storybook",
    emoji: "📖",
    description: "Rich, painterly, timeless fairy-tale look",
    prompt:
      "Classic hand-painted storybook illustration, rich gouache-and-oil detail, expressive painterly brushwork, warm golden lighting, deep atmospheric color, timeless fairy-tale craftsmanship like a beloved vintage picture book.",
  },
  {
    key: "cartoon",
    label: "Playful Cartoon",
    emoji: "🌈",
    description: "Bold outlines and bright, fun colors",
    prompt:
      "Bright modern cartoon illustration, bold confident clean outlines, vivid saturated colors, smooth flat shading with soft gradients, expressive friendly characters, polished animation-studio finish.",
  },
  {
    key: "papercut",
    label: "Paper Cut-Out",
    emoji: "✂️",
    description: "Layered paper collage with soft shadows",
    prompt:
      "Layered paper-cut collage illustration, crisp crafted shapes, tactile construction-paper texture, soft realistic drop shadows, dimensional handmade depth, warm balanced palette.",
  },
  {
    key: "crayon",
    label: "Crayon & Pencil",
    emoji: "🖍️",
    description: "Soft hand-drawn, childlike charm",
    prompt:
      "Hand-drawn crayon and colored-pencil illustration with visible waxy crayon and colored-pencil strokes, uneven childlike hand-drawn linework, matte sketchbook paper texture, naive and imperfect, deliberately unpolished and rough, warm childlike charm, lovingly imperfect handmade lines — not digital, not smooth, not glossy, not painterly.",
  },
  {
    key: "dreamy3d",
    label: "Dreamy 3D",
    emoji: "✨",
    description: "Soft rounded characters, gentle lighting",
    prompt:
      "Soft 3D-rendered illustration, rounded friendly characters, gentle volumetric lighting, smooth tactile surfaces, subsurface glow, cozy modern Pixar-like warmth, shallow depth of field.",
  },
];

export const DEFAULT_ART_STYLE = ART_STYLES[0];

/** Resolve a style key to its prompt sentence. Falls back to the default. */
export function resolveArtStyle(key: string | undefined): string {
  return (ART_STYLES.find((s) => s.key === key) ?? DEFAULT_ART_STYLE).prompt;
}
