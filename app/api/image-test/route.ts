import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateTestImage } from "@/lib/images";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  // Dev-only: this hits the paid image API. Never expose it in production.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const { prompt, model } = await req.json();
    const cleanPrompt = String(prompt || "").trim();
    if (cleanPrompt.length < 10) {
      return NextResponse.json({ error: "Enter a more descriptive prompt." }, { status: 400 });
    }
    if (cleanPrompt.length > 3000) {
      return NextResponse.json({ error: "Prompt is too long." }, { status: 400 });
    }
    // Only allow comparing a known short-list of fal models from the test page.
    const ALLOWED = [
      "fal-ai/nano-banana",
      "fal-ai/recraft-v3",
      "fal-ai/imagen4/preview",
      "fal-ai/flux-pro/v1.1-ultra",
      "fal-ai/flux/dev",
    ];
    const chosen = typeof model === "string" && ALLOWED.includes(model) ? model : undefined;

    const imageUrl = await generateTestImage(cleanPrompt, chosen);
    return NextResponse.json({
      imageUrl,
      model: chosen || process.env.FAL_TEXT_TO_IMAGE_MODEL || "fal-ai/nano-banana",
    });
  } catch (err) {
    console.error("image-test error", err);
    const message = err instanceof Error ? err.message : "Image generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
