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
    const { prompt } = await req.json();
    const cleanPrompt = String(prompt || "").trim();
    if (cleanPrompt.length < 10) {
      return NextResponse.json({ error: "Enter a more descriptive prompt." }, { status: 400 });
    }
    if (cleanPrompt.length > 3000) {
      return NextResponse.json({ error: "Prompt is too long." }, { status: 400 });
    }

    const imageUrl = await generateTestImage(cleanPrompt);
    return NextResponse.json({
      imageUrl,
      model: process.env.FAL_TEXT_TO_IMAGE_MODEL || "fal-ai/nano-banana",
    });
  } catch (err) {
    console.error("image-test error", err);
    const message = err instanceof Error ? err.message : "Image generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
