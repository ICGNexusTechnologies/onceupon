import Anthropic from "@anthropic-ai/sdk";
import { resolveLanguage } from "@/lib/languages";

const MODEL = "claude-sonnet-4-6";
const TOTAL_PAGES = 40;
const CHUNKS = [14, 13, 13]; // 3 chunks → exactly 40 pages
const MAX_PAGE_CHARS = 180;

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

export interface StoryInput {
  name: string;
  age: number;
  hairColor: string;
  skinTone: string;
  outfitColor: string;
  loves: string;
  value: string;
  world: string;
  tone: string;
  storyDescription?: string;
  dedication: string;
  /** Buyer-chosen illustration style (resolved prompt sentence). */
  artStyle: string;
  /** Language code the story text is written in (default "en"). */
  language?: string;
}

export interface StoryPage {
  pageNumber: number;
  text: string;
  setting: string;
  time: string;
  imagePrompt: string;
}

export interface StoryResult {
  title: string;
  dedication: string;
  characterSheet: string;
  artStyle: string;
  pages: StoryPage[];
}

// Keep this byte-identical across all chunk calls so the prompt cache hits.
const SYSTEM_PROMPT = `You are a master children's picture-book author writing a premium personalized hardcover. The child is the hero on every page. Warm, wholesome, strictly age-appropriate — nothing scary, violent, sexual, or adult. Match vocabulary to the age. Across the whole 40 page book build a satisfying arc: setup, call to adventure, rising discovery, a challenge tied to the chosen value, a brave/kind resolution, cozy ending. Weave in what the child loves. Each page must contain 1-2 short sentences, target 80-140 characters, and never exceed ${MAX_PAGE_CHARS} characters including spaces. Do not write "THE END" in page text; the book layout adds a separate closing page. Each page's imagePrompt describes the scene, pose, action, and lighting as ONE single continuous full-bleed illustration (never a collage, grid, multiple small panels, framed insets, vignettes, or empty white space). Do NOT repeat the hero's physical appearance in it (that is added separately when illustrating), but you MUST name the exact color, material, and form of every prop, garment, or object the page text mentions or implies, worded to match the text exactly — if the text says a green scarf, the imagePrompt must also say "green scarf". The characterSheet is a detailed, fixed physical description of the hero (face, hair, skin, outfit, proportions) written for an illustrator, and it also lists every recurring prop or wardrobe item with its exact, unchanging color and material. The artStyle is one sentence describing a consistent illustration style for the whole book.

CONTINUITY RULES (critical):
- Every character (including pets and sidekicks) gets exactly ONE name, fixed the first time they appear. Use that exact name on every page — never rename, vary, or substitute it. The child's personalization details (name, pet name, interests) are canonical.
- Every prop, garment, or named object has ONE fixed appearance (exact color and material) set the first time it appears; record it in the characterSheet and never let the text and the illustration disagree on a color, name, or detail — a scarf called green in the text is "green scarf" in every imagePrompt that shows it.
- Track every character's location page by page. A companion who joins the adventure stays present in the scenes (or gets an explicit written exit) until the story brings them home — a character must never be in two places at once (e.g., aboard the ship on one page and waiting at home on another).
- Never contradict an earlier page's facts (time of day, items held, weather, who knows what). Anything introduced — an object, clue, or promise — must pay off by the end.
- The storyBible field is the single source of truth for this: one line per character in the form "Name — species/role — current location at the end of these pages". When continuing a story, copy the names from the provided storyBible exactly and update only the locations.
- Before returning, verify: each character has exactly one name everywhere; each page's locations follow from the previous page; the ending resolves the opening goal and everyone who left home returns home. Fix any failure before output.`;

const pageSchema = {
  type: "object",
  properties: {
    pageNumber: { type: "integer" },
    text: { type: "string", maxLength: MAX_PAGE_CHARS },
    setting: { type: "string" },
    time: { type: "string", enum: ["day", "night"] },
    imagePrompt: { type: "string" },
  },
  required: ["pageNumber", "text", "setting", "time", "imagePrompt"],
  additionalProperties: false,
} as const;

const chunkSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    dedication: { type: "string" },
    characterSheet: { type: "string" },
    artStyle: { type: "string" },
    storyBible: { type: "string" },
    pages: { type: "array", items: pageSchema },
  },
  required: ["title", "dedication", "characterSheet", "artStyle", "storyBible", "pages"],
  additionalProperties: false,
} as const;

interface ChunkResult {
  title: string;
  dedication: string;
  characterSheet: string;
  artStyle: string;
  storyBible: string;
  pages: StoryPage[];
}

async function generateChunk(userPrompt: string, attempt = 0): Promise<ChunkResult> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    output_config: {
      format: { type: "json_schema", schema: chunkSchema },
    },
    messages: [{ role: "user", content: userPrompt }],
  });

  if (response.stop_reason === "max_tokens") {
    if (attempt >= 2) throw new Error("Story chunk repeatedly truncated");
    return generateChunk(userPrompt + "\nKeep every field as short as possible.", attempt + 1);
  }
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("No text block in response");
  return JSON.parse(text.text) as ChunkResult;
}

export async function generateStory(input: StoryInput): Promise<StoryResult> {
  const lang = resolveLanguage(input.language);
  // Story title + page text go in the target language; the illustrator-facing
  // fields (characterSheet, imagePrompt, artStyle, storyBible) stay in English so
  // the image model keeps performing well.
  const languageLine =
    lang.code === "en"
      ? ""
      : ` LANGUAGE: Write the book's "title" and every page's "text" in ${lang.promptName}, using natural, age-appropriate wording a native-speaking parent would read aloud (correct accents and punctuation). Keep "characterSheet", "imagePrompt", "artStyle", and "storyBible" in English. The ${MAX_PAGE_CHARS}-character per-page limit still applies in ${lang.promptName}.`;
  const childDesc =
    `Child: ${input.name}, age ${input.age}. Hair color ${input.hairColor}, skin tone ${input.skinTone}, ` +
    `outfit color ${input.outfitColor}. Loves: ${input.loves}. Story celebrates: ${input.value}. ` +
    `World: ${input.world}. Mood: ${input.tone}.` +
    (input.storyDescription ? ` Parent's story description to incorporate: ${input.storyDescription}.` : "") +
    ` Illustration style (use this exact style for artStyle): ${input.artStyle}` +
    (input.dedication ? ` Dedication: ${input.dedication}` : "") +
    languageLine;

  // Chunk 1 — establishes title, characterSheet, artStyle, storyBible, pages 1-14
  const first = await generateChunk(
    `${childDesc}\n\nWrite pages 1-${CHUNKS[0]} of the ${TOTAL_PAGES}-page book (the setup and call to adventure). ` +
      `Also create the title, dedication, characterSheet, artStyle, and storyBible.`
  );

  let pages: StoryPage[] = first.pages;
  let storyBible = first.storyBible;
  let start = CHUNKS[0] + 1;

  for (let c = 1; c < CHUNKS.length; c++) {
    const end = start + CHUNKS[c] - 1;
    const summary = pages
      .slice(-6)
      .map((p) => `${p.pageNumber}: ${p.text}`)
      .join(" ");
    const isLast = c === CHUNKS.length - 1;
    const chunk = await generateChunk(
      `${childDesc}\n\nThe book so far — title: "${first.title}". characterSheet: ${first.characterSheet} ` +
        `artStyle: ${first.artStyle} storyBible: ${storyBible} Recent pages: ${summary}\n\nContinue the SAME story. Write pages ${start}-${end} of ${TOTAL_PAGES}` +
        (isLast
          ? ` — this is the FINAL chunk: include the challenge resolution and the cozy ending, with page ${TOTAL_PAGES} as the last page. Everyone who left home (including pets) must arrive home together.`
          : ` (rising discovery and the central challenge).`) +
        ` Use EXACTLY the character names and current locations from the storyBible — never introduce a new name for an existing character. ` +
        `Repeat the same title, characterSheet, and artStyle in your output, and output the storyBible with locations updated for your pages. Number pages ${start} to ${end}.`
    );
    pages = pages.concat(chunk.pages);
    storyBible = chunk.storyBible;
    start = end + 1;
  }

  // Normalize numbering and enforce exactly TOTAL_PAGES
  pages = pages.slice(0, TOTAL_PAGES).map((p, idx) => ({
    ...p,
    pageNumber: idx + 1,
    text: p.text.trim(),
  }));
  if (pages.length !== TOTAL_PAGES) {
    throw new Error(`Expected ${TOTAL_PAGES} pages, got ${pages.length}`);
  }
  const oversizedPage = pages.find((page) => page.text.length > MAX_PAGE_CHARS);
  if (oversizedPage) {
    throw new Error(
      `Page ${oversizedPage.pageNumber} exceeds the ${MAX_PAGE_CHARS}-character layout limit`
    );
  }

  return {
    title: first.title || `${input.name}'s Adventure`,
    dedication: first.dedication || input.dedication || "",
    characterSheet: first.characterSheet,
    // Always honor the buyer's chosen style, not whatever the model echoed back.
    artStyle: input.artStyle,
    pages,
  };
}

/** One-time back-cover synopsis for a finished book (cached on the Book document). */
export async function generateSynopsis(title: string, storyText: string, language?: string): Promise<string> {
  const lang = resolveLanguage(language);
  const langInstruction = lang.code === "en" ? "" : ` Write the synopsis in ${lang.promptName}.`;
  const res = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 300,
    system:
      "You write back-cover synopses for personalized children's picture books. Given a book's title and full text, reply with only a warm 2-3 sentence synopsis (under 60 words) that teases the adventure without revealing the ending. Plain prose only: no markdown, no headings, and do not repeat the title." +
      langInstruction,
    messages: [{ role: "user", content: `Title: ${title}\n\nStory:\n${storyText}` }],
  });
  const text = res.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("No synopsis text in response");
  return cleanSynopsis(text.text, title);
}

/** Strip markdown formatting and a leading repeated title from a synopsis. */
function cleanSynopsis(raw: string, title: string): string {
  const lines = raw
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  while (
    lines.length > 1 &&
    (lines[0].startsWith("#") || lines[0].replace(/[*_#]/g, "").trim().toLowerCase() === title.trim().toLowerCase())
  ) {
    lines.shift();
  }
  return lines.join(" ").replace(/[*_#]+/g, "").trim();
}

/** Lightweight moderation check on free-text input. */
export async function moderateLoves(loves: string): Promise<boolean> {
  const res = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 16,
    system:
      'You check a short free-text answer a parent gave about what their child loves, for a children\'s book. Reply with exactly "ok" if it is appropriate for a children\'s story, or "no" if it contains anything sexual, violent, hateful, or otherwise inappropriate for a children\'s book.',
    messages: [{ role: "user", content: loves }],
  });
  const text = res.content.find((b) => b.type === "text");
  return text?.type === "text" && text.text.trim().toLowerCase().startsWith("ok");
}
