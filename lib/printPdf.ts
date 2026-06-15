import {
  PDFDocument,
  PDFFont,
  PDFImage,
  PDFName,
  PDFString,
  PDFHexString,
  PDFHeader,
  rgb,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFileSync } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import type { IBook } from "@/models/Book";

/**
 * PRINT file for Gelato photo books, emitted as a valid PDF/X-4 with the
 * GRACoL 2006 output intent (Gelato's hard requirement). ONE combined multi-page
 * PDF (front cover + interior + back cover); pageCount = total pages.
 *
 * PDF/X-4 essentials handled here: embedded (subset) fonts, embedded ICC output
 * intent, per-page TrimBox + BleedBox, PDF/X XMP metadata, a file /ID, and a
 * PDF 1.6 header. RGB images are permitted in X-4 because an output intent is present.
 */

const mm = (v: number) => (v * 72) / 25.4;

const BLEED_MM = 4; // Gelato: 4mm bleed all sides
const TRIM_W_MM = 203.2;
const TRIM_H_MM = 279.4;
const PAGE_W = mm(TRIM_W_MM + BLEED_MM * 2);
const PAGE_H = mm(TRIM_H_MM + BLEED_MM * 2);
const BLEED = mm(BLEED_MM);
const TRIM_W = mm(TRIM_W_MM);
const TRIM_H = mm(TRIM_H_MM);
const SAFE = mm(BLEED_MM + 4); // text/graphics >= 4mm inside the trim line

const CREAM = rgb(0.984, 0.957, 0.902);
const PLUM = rgb(0.23, 0.16, 0.36);
const MARIGOLD = rgb(0.91, 0.64, 0.24);
const CORAL = rgb(0.88, 0.4, 0.31);

const TEXT_SIZE = 17;
const LINE_HEIGHT = 23;

const ASSET = (...p: string[]) => path.join(process.cwd(), "lib", "assets", ...p);
let _fonts: { regular: Buffer; italic: Buffer; bold: Buffer } | null = null;
let _icc: Buffer | null = null;
function fontBytes() {
  if (!_fonts)
    _fonts = {
      regular: readFileSync(ASSET("fonts", "Tinos-Regular.ttf")),
      italic: readFileSync(ASSET("fonts", "Tinos-Italic.ttf")),
      bold: readFileSync(ASSET("fonts", "Tinos-Bold.ttf")),
    };
  return _fonts;
}
function iccBytes() {
  if (!_icc) _icc = readFileSync(ASSET("icc", "GRACoL2006_Coated1v2.icc"));
  return _icc;
}

function safePdfText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[^\x20-\x7E -ÿ‘’“”–—]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = safePdfText(text).split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

type Page = ReturnType<PDFDocument["addPage"]>;

function drawCenteredLines(
  page: Page,
  cx: number,
  lines: string[],
  font: PDFFont,
  size: number,
  lineHeight: number,
  centerY: number,
  color = PLUM
) {
  let y = centerY + ((lines.length - 1) * lineHeight) / 2;
  for (const line of lines) {
    page.drawText(line, { x: cx - font.widthOfTextAtSize(line, size) / 2, y, size, font, color });
    y -= lineHeight;
  }
}

function drawImageFill(page: Page, image: PDFImage, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / image.width, h / image.height);
  const dw = image.width * scale;
  const dh = image.height * scale;
  page.drawImage(image, { x: x - (dw - w) / 2, y: y - (dh - h) / 2, width: dw, height: dh });
}

const DEFAULT_IMG_TRANSFORM = "f_jpg,q_auto:good,w_2400"; // ~300dpi for an 8in page

async function embedPrintImage(pdf: PDFDocument, url: string, transform = DEFAULT_IMG_TRANSFORM) {
  const hi =
    url.includes("res.cloudinary.com") && url.includes("/image/upload/")
      ? url.replace("/image/upload/", `/image/upload/${transform}/`)
      : url;
  const res = await fetch(hi, { signal: AbortSignal.timeout(45_000) });
  if (!res.ok) throw new Error(`Couldn't fetch image for print (${res.status})`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("png") ? pdf.embedPng(bytes) : pdf.embedJpg(bytes);
}

/** Add a print page with the required PDF/X boxes (MediaBox incl. bleed; TrimBox = trim). */
function addPrintPage(pdf: PDFDocument): Page {
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  page.setBleedBox(0, 0, PAGE_W, PAGE_H);
  page.setTrimBox(BLEED, BLEED, TRIM_W, TRIM_H);
  return page;
}

/** Turn the document into a PDF/X-4 file with the GRACoL 2006 output intent. */
function applyPdfX4(pdf: PDFDocument, title: string) {
  const ctx = pdf.context;

  // Embedded CMYK output-intent profile (GRACoL 2006).
  const iccStream = ctx.flateStream(iccBytes(), { N: 4 });
  const iccRef = ctx.register(iccStream);
  const outputIntent = ctx.obj({
    Type: "OutputIntent",
    S: "GTS_PDFX",
    OutputConditionIdentifier: PDFString.of("GRACoL2006_Coated1v2"),
    Info: PDFString.of("GRACoL2006_Coated1v2"),
    RegistryName: PDFString.of("http://www.color.org"),
    DestOutputProfile: iccRef,
  });
  pdf.catalog.set(PDFName.of("OutputIntents"), ctx.obj([ctx.register(outputIntent)]));

  // PDF/X identification via XMP metadata.
  const xmp = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:pdfxid="http://www.npes.org/pdfx/ns/id/">
      <pdfxid:GTS_PDFXVersion>PDF/X-4</pdfxid:GTS_PDFXVersion>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${title}</rdf:li></rdf:Alt></dc:title>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
      <pdf:Producer>Once Upon</pdf:Producer>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
  const metaStream = ctx.stream(xmp, { Type: "Metadata", Subtype: "XML" });
  pdf.catalog.set(PDFName.of("Metadata"), ctx.register(metaStream));

  // PDF/X requires a file identifier in the trailer.
  const id = PDFHexString.of(randomBytes(16).toString("hex"));
  ctx.trailerInfo.ID = ctx.obj([id, id]);

  // PDF/X-4 is built on PDF 1.6.
  ctx.header = PDFHeader.forVersion(1, 6);
}

/**
 * Build the combined PDF/X-4 print file: front cover + interior + back cover.
 * Returns the buffer and the total page count (sent to Gelato as pageCount).
 */
export async function buildPrintPdf(
  book: IBook,
  opts: { imageTransform?: string } = {}
): Promise<{ pdf: Buffer; pageCount: number }> {
  const imgTransform = opts.imageTransform ?? DEFAULT_IMG_TRANSFORM;
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  // Full embed (not subset): pdf-lib's subsetting drops glyphs with these fonts,
  // and full embedding is small (~1.3MB) and fully PDF/X-4 valid.
  const fb = fontBytes();
  const bodyFont = await pdf.embedFont(fb.regular);
  const italicFont = await pdf.embedFont(fb.italic);
  const titleFont = await pdf.embedFont(fb.bold);
  const labelFont = titleFont;
  const cx = PAGE_W / 2;

  pdf.setTitle(safePdfText(book.title));
  pdf.setProducer("Once Upon");
  pdf.setAuthor("Once Upon");

  const fill = (page: Page, color = CREAM) => page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color });

  // FRONT COVER
  const front = addPrintPage(pdf);
  if (book.coverUrl) {
    const cover = await embedPrintImage(pdf, book.coverUrl, imgTransform);
    drawImageFill(front, cover, 0, 0, PAGE_W, PAGE_H);
  } else {
    fill(front, PLUM);
    drawCenteredLines(front, cx, wrapText(book.title, titleFont, 36, PAGE_W - SAFE * 2), titleFont, 36, 42, PAGE_H * 0.55, CREAM);
  }

  // TITLE PAGE
  const titlePage = addPrintPage(pdf);
  fill(titlePage);
  drawCenteredLines(titlePage, cx, wrapText(book.title, titleFont, 34, PAGE_W - SAFE * 2), titleFont, 34, 40, PAGE_H * 0.6);
  drawCenteredLines(
    titlePage,
    cx,
    [`A personalized adventure starring ${safePdfText(book.child.name)}`],
    italicFont,
    16,
    22,
    PAGE_H * 0.45
  );

  // DEDICATION PAGE
  const dedPage = addPrintPage(pdf);
  fill(dedPage, PLUM);
  drawCenteredLines(dedPage, cx, [`Made especially for ${safePdfText(book.child.name)}`], titleFont, 26, 32, PAGE_H * 0.62, CREAM);
  const dedText =
    safePdfText(book.dedication) ||
    `May this adventure remind you that your curiosity, courage, and imagination can take you anywhere.`;
  drawCenteredLines(dedPage, cx, wrapText(dedText, italicFont, 17, PAGE_W - SAFE * 3), italicFont, 17, 25, PAGE_H * 0.45, CREAM);

  // STORY PAGES
  for (const sp of book.pages) {
    if (!sp.imageUrl) throw new Error(`Page ${sp.pageNumber} has no illustration`);
    const page = addPrintPage(pdf);
    const img = await embedPrintImage(pdf, sp.imageUrl, imgTransform);
    drawImageFill(page, img, 0, 0, PAGE_W, PAGE_H);

    const text =
      sp.pageNumber === book.pages.length ? sp.text.replace(/\s*THE END\.?\s*$/i, "").trim() : sp.text;
    const panelX = SAFE;
    const panelW = PAGE_W - panelX * 2;
    const textX = panelX + mm(6);
    const lines = wrapText(text, bodyFont, TEXT_SIZE, panelW - mm(12));
    const panelH = Math.max(mm(20), lines.length * LINE_HEIGHT + mm(14));
    const panelY = SAFE;

    page.drawRectangle({ x: panelX, y: panelY, width: panelW, height: panelH, color: CREAM, opacity: 0.94 });
    page.drawRectangle({ x: panelX, y: panelY, width: 5, height: panelH, color: CORAL, opacity: 0.9 });

    let y = panelY + panelH - mm(10);
    for (const line of lines) {
      page.drawText(line, { x: textX, y, size: TEXT_SIZE, font: bodyFont, color: PLUM });
      y -= LINE_HEIGHT;
    }
  }

  // CLOSING PAGE
  const closing = addPrintPage(pdf);
  fill(closing);
  drawCenteredLines(closing, cx, ["The End"], titleFont, 40, 44, PAGE_H * 0.55);
  drawCenteredLines(
    closing,
    cx,
    [`But ${safePdfText(book.child.name)}'s next adventure is only a page away.`],
    italicFont,
    16,
    22,
    PAGE_H * 0.45
  );

  // BACK COVER
  const back = addPrintPage(pdf);
  fill(back, PLUM);
  drawCenteredLines(back, cx, ["ONCE UPON"], labelFont, 14, 18, PAGE_H - SAFE - mm(8), MARIGOLD);
  drawCenteredLines(back, cx, wrapText(book.title, titleFont, 22, PAGE_W - SAFE * 2), titleFont, 22, 28, PAGE_H * 0.55, CREAM);
  drawCenteredLines(
    back,
    cx,
    wrapText(`A personalized storybook for ${safePdfText(book.child.name)}.`, italicFont, 13, PAGE_W - SAFE * 2.5),
    italicFont,
    13,
    18,
    PAGE_H * 0.4,
    CREAM
  );

  // Even total page count (Gelato requirement)
  if (pdf.getPageCount() % 2 !== 0) fill(addPrintPage(pdf));

  applyPdfX4(pdf, safePdfText(book.title));

  const pageCount = pdf.getPageCount();
  const buf = Buffer.from(await pdf.save({ useObjectStreams: false }));
  // pdf-lib always writes a 1.7 header; PDF/X-4 is defined on PDF 1.6. Same byte
  // length, so xref offsets are unaffected.
  if (buf.subarray(0, 8).toString("latin1") === "%PDF-1.7") buf.write("%PDF-1.6", 0, "latin1");
  return { pdf: buf, pageCount };
}
