import { PDFDocument, PDFFont, PDFImage, StandardFonts, rgb } from "pdf-lib";
import type { IBook } from "@/models/Book";

const PAGE_WIDTH = 576; // 8 inches at 72 DPI
const PAGE_HEIGHT = 720; // 10 inches at 72 DPI
const MARGIN = 42;
const TEXT_SIZE = 17;
const LINE_HEIGHT = 23;
const CREAM = rgb(0.984, 0.957, 0.902);
const PLUM = rgb(0.23, 0.16, 0.36);
const MARIGOLD = rgb(0.91, 0.64, 0.24);
const CORAL = rgb(0.88, 0.4, 0.31);

function safePdfText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[^\x20-\x7E\u00A0-\u00FF\u2018\u2019\u201C\u201D\u2013\u2014]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = safePdfText(text).split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCenteredLines(
  page: ReturnType<PDFDocument["addPage"]>,
  lines: string[],
  font: PDFFont,
  size: number,
  lineHeight: number,
  centerY: number,
  color = PLUM
) {
  let y = centerY + ((lines.length - 1) * lineHeight) / 2;
  for (const line of lines) {
    page.drawText(line, {
      x: (PAGE_WIDTH - font.widthOfTextAtSize(line, size)) / 2,
      y,
      size,
      font,
      color,
    });
    y -= lineHeight;
  }
}

function drawBrandMark(
  page: ReturnType<PDFDocument["addPage"]>,
  font: PDFFont,
  y: number
) {
  const label = "ONCE UPONLY";
  page.drawText(label, {
    x: (PAGE_WIDTH - font.widthOfTextAtSize(label, 10)) / 2,
    y,
    size: 10,
    font,
    color: MARIGOLD,
  });
  page.drawCircle({ x: PAGE_WIDTH / 2 - 52, y: y + 4, size: 2.2, color: CORAL });
  page.drawCircle({ x: PAGE_WIDTH / 2 + 52, y: y + 4, size: 2.2, color: CORAL });
}

function drawImageCover(
  page: ReturnType<PDFDocument["addPage"]>,
  image: PDFImage,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  page.drawImage(image, {
    x: x - (drawWidth - width) / 2,
    y: y - (drawHeight - height) / 2,
    width: drawWidth,
    height: drawHeight,
  });
}

async function embedRemoteImage(pdf: PDFDocument, url: string) {
  const optimizedUrl = url.includes("res.cloudinary.com") && url.includes("/image/upload/")
    ? url.replace("/image/upload/", "/image/upload/f_jpg,q_auto:good,w_1200/")
    : url;
  const res = await fetch(optimizedUrl, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Couldn't fetch book image (${res.status})`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("png")) {
    return pdf.embedPng(bytes);
  }
  return pdf.embedJpg(bytes);
}

export async function buildBookPdf(book: IBook): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const bodyFont = await pdf.embedFont(StandardFonts.TimesRoman);
  const italicFont = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const titleFont = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const labelFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  pdf.setTitle(safePdfText(book.title));
  pdf.setAuthor("Once Uponly");
  pdf.setSubject(`Personalized storybook for ${safePdfText(book.child.name)}`);

  if (book.coverUrl) {
    const coverPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const cover = await embedRemoteImage(pdf, book.coverUrl);
    drawImageCover(coverPage, cover, 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  }

  const titlePage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  titlePage.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: CREAM });
  drawBrandMark(titlePage, labelFont, 652);
  const titleLines = wrapText(book.title, titleFont, 34, PAGE_WIDTH - 120);
  drawCenteredLines(titlePage, titleLines, titleFont, 34, 40, 410);
  const subtitle = `A personalized adventure starring ${safePdfText(book.child.name)}`;
  drawCenteredLines(titlePage, [subtitle], italicFont, 16, 22, 310);
  titlePage.drawCircle({ x: PAGE_WIDTH / 2, y: 245, size: 5, color: MARIGOLD });
  titlePage.drawCircle({ x: PAGE_WIDTH / 2 - 20, y: 245, size: 2.5, color: CORAL });
  titlePage.drawCircle({ x: PAGE_WIDTH / 2 + 20, y: 245, size: 2.5, color: CORAL });

  const dedicationPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  dedicationPage.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: PLUM });
  drawBrandMark(dedicationPage, labelFont, 652);
  const dedicationHeading = `Made especially for ${safePdfText(book.child.name)}`;
  drawCenteredLines(dedicationPage, [dedicationHeading], titleFont, 28, 34, 475, CREAM);
  const dedicationText =
    safePdfText(book.dedication) ||
    `May this adventure remind you that your curiosity, courage, and imagination can take you anywhere.`;
  const dedicationLines = wrapText(dedicationText, italicFont, 17, PAGE_WIDTH - 150);
  drawCenteredLines(dedicationPage, dedicationLines, italicFont, 17, 25, 350, CREAM);
  const details = `A story about ${safePdfText(book.value).toLowerCase()}, inspired by ${safePdfText(
    book.loves
  )}.`;
  drawCenteredLines(dedicationPage, wrapText(details, bodyFont, 12, PAGE_WIDTH - 160), bodyFont, 12, 18, 220, MARIGOLD);

  for (const storyPage of book.pages) {
    if (!storyPage.imageUrl) {
      throw new Error(`Page ${storyPage.pageNumber} has no illustration`);
    }

    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const image = await embedRemoteImage(pdf, storyPage.imageUrl);
    drawImageCover(page, image, 0, 0, PAGE_WIDTH, PAGE_HEIGHT);

    const storyText =
      storyPage.pageNumber === book.pages.length
        ? storyPage.text.replace(/\s*THE END\.?\s*$/i, "").trim()
        : storyPage.text;
    const panelX = 28;
    const panelWidth = PAGE_WIDTH - panelX * 2;
    const textX = panelX + 28;
    const lines = wrapText(storyText, bodyFont, TEXT_SIZE, panelWidth - 56);
    const textHeight = lines.length * LINE_HEIGHT;
    const panelHeight = Math.max(150, textHeight + 72);
    const panelY = 26;

    page.drawRectangle({
      x: panelX + 4,
      y: panelY - 4,
      width: panelWidth,
      height: panelHeight,
      color: rgb(0.08, 0.06, 0.12),
      opacity: 0.2,
    });
    page.drawRectangle({
      x: panelX,
      y: panelY,
      width: panelWidth,
      height: panelHeight,
      color: CREAM,
      opacity: 0.94,
    });
    page.drawRectangle({
      x: panelX,
      y: panelY,
      width: 5,
      height: panelHeight,
      color: CORAL,
      opacity: 0.9,
    });

    const label = `PAGE ${storyPage.pageNumber}`;
    page.drawText(label, {
      x: textX,
      y: panelY + panelHeight - 31,
      size: 8.5,
      font: labelFont,
      color: MARIGOLD,
    });
    page.drawCircle({
      x: panelX + panelWidth - 28,
      y: panelY + panelHeight - 27,
      size: 2.4,
      color: CORAL,
    });

    let y = panelY + panelHeight - 65;
    for (const line of lines) {
      page.drawText(line, {
        x: textX,
        y,
        size: TEXT_SIZE,
        font: bodyFont,
        color: PLUM,
      });
      y -= LINE_HEIGHT;
    }
  }

  const closingPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  closingPage.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: CREAM });
  drawBrandMark(closingPage, labelFont, 652);
  drawCenteredLines(closingPage, ["The End"], titleFont, 40, 44, 390);
  drawCenteredLines(
    closingPage,
    [`But ${safePdfText(book.child.name)}'s next adventure is only a page away.`],
    italicFont,
    16,
    22,
    315
  );
  drawCenteredLines(closingPage, ["Made with love, imagination, and a little magic."], bodyFont, 11, 16, 125, PLUM);

  return Buffer.from(await pdf.save());
}
