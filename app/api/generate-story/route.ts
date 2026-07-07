import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Book from "@/models/Book";
import { generateStory, moderateLoves } from "@/lib/story";
import { resolveArtStyle } from "@/lib/artStyles";
import { resolveLanguage } from "@/lib/languages";

export const maxDuration = 300; // story gen takes a few minutes (3 chunked LLM calls)

const PREVIEWS_PER_DAY = 3;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const body = await req.json();
    const {
      name,
      age,
      hairColor,
      skinTone,
      outfitColor,
      loves,
      value,
      world,
      tone,
      storyDescription,
      dedication,
      artStyle,
      language,
    } = body;
    if (!name || !loves) {
      return NextResponse.json({ error: "Name and loves are required." }, { status: 400 });
    }
    const lang = resolveLanguage(language); // falls back to English for anything unknown

    await dbConnect();

    // Rate-limit free previews to 3/day per account
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await Book.countDocuments({ userId: session.userId, createdAt: { $gte: since } });
    if (recent >= PREVIEWS_PER_DAY) {
      return NextResponse.json(
        { error: "You've reached today's limit of 3 free previews. Come back tomorrow!" },
        { status: 429 }
      );
    }

    if (!(await moderateLoves(String(loves)))) {
      return NextResponse.json(
        { error: "Please keep the answer child-friendly — try describing a favorite animal, hobby, or toy." },
        { status: 400 }
      );
    }
    if (storyDescription && !(await moderateLoves(String(storyDescription)))) {
      return NextResponse.json(
        { error: "Please keep the story description child-friendly." },
        { status: 400 }
      );
    }

    const story = await generateStory({
      name: String(name),
      age: Number(age) || 5,
      hairColor: String(hairColor || "#4A3220"),
      skinTone: String(skinTone || "#C68A5E"),
      outfitColor: String(outfitColor || "#7E4FA8"),
      loves: String(loves),
      value: String(value || "Bravery"),
      world: String(world || "Magic forest"),
      tone: String(tone || "Magical"),
      storyDescription: String(storyDescription || ""),
      dedication: String(dedication || ""),
      artStyle: resolveArtStyle(artStyle),
      language: lang.code,
    });

    const book = await Book.create({
      userId: session.userId,
      title: story.title,
      dedication: story.dedication,
      child: {
        name,
        age: Number(age) || 5,
        hairColor,
        skinTone,
        outfitColor,
      },
      loves,
      value,
      world,
      tone,
      storyDescription,
      language: lang.code,
      characterSheet: story.characterSheet,
      artStyle: story.artStyle,
      status: "preview",
      pages: story.pages,
    });

    return NextResponse.json({ bookId: book._id.toString() });
  } catch (err) {
    console.error("generate-story error", err);
    return NextResponse.json({ error: "Something went wrong creating the book." }, { status: 500 });
  }
}
