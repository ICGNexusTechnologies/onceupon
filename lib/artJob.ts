import { dbConnect } from "@/lib/db";
import Book from "@/models/Book";
import Order from "@/models/Order";
import { generateHeroReference, generatePageImage, upscaleImage } from "@/lib/images";
import { uploadImage, uploadPdf } from "@/lib/cloudinary";
import { buildBookPdf } from "@/lib/pdf";
import { submitOrderToGelato } from "@/lib/gelato";

const BATCH = 4; // concurrent image generations

/**
 * Generate art for every page of a paid book. Idempotent and resumable:
 * pages that already have an imageUrl are skipped, so a retry after a partial
 * failure doesn't regenerate (or re-bill) completed pages.
 */
export async function runArtJob(
  bookId: string,
  options: { rebuildPdf?: boolean } = {}
): Promise<void> {
  await dbConnect();
  const book = await Book.findById(bookId);
  if (!book) throw new Error(`Book ${bookId} not found`);
  if (book.status === "complete" && book.pdfUrl && !options.rebuildPdf) return;

  book.status = "generating_art";
  await book.save();

  try {
    const pending = book.pages.filter((p) => !p.imageUrl);
    if (pending.length) {
      // Persist the identity anchor so a retry does not create and bill for another one.
      if (!book.heroReferenceUrl) {
        const rawReference = await generateHeroReference(book.characterSheet, book.artStyle);
        book.heroReferenceUrl = await uploadImage(rawReference, `book-${book._id}-hero-reference`);
        await book.save();
      }
      const referenceUrl = book.heroReferenceUrl;

      for (let n = 0; n < pending.length; n += BATCH) {
        const batch = pending.slice(n, n + BATCH);
        await Promise.all(
          batch.map(async (page) => {
            const raw = await generatePageImage(
              referenceUrl,
              book.characterSheet,
              book.artStyle,
              page.imagePrompt
            );
            // Upscale to print resolution when FAL_UPSCALE_MODEL is configured (no-op otherwise).
            const finished = await upscaleImage(raw);
            page.imageUrl = await uploadImage(finished, `book-${book._id}-p${page.pageNumber}`);
          })
        );
        await book.save(); // checkpoint after each batch so progress is resumable
      }
    }

    if (!book.pdfUrl || options.rebuildPdf) {
      const pdf = await buildBookPdf(book);
      book.pdfUrl = await uploadPdf(pdf, `book-${book._id}.pdf`);
    }
    book.status = "complete";
    await book.save();

    // Hand the finished book off to print-on-demand fulfillment. This is a no-op
    // unless GELATO_ENABLED is set, so test orders are never submitted by accident.
    try {
      const order = await Order.findOne({
        bookId: book._id,
        status: { $ne: "pending" },
        format: { $in: ["softcover", "hardcover"] },
      }).sort({ createdAt: -1 });
      if (order && !order.gelatoOrderId) {
        const result = await submitOrderToGelato(book, order);
        if (result) {
          order.gelatoOrderId = result.gelatoOrderId;
          order.status = "printing";
          await order.save();
        }
      }
    } catch (err) {
      console.error(`gelato submission failed for book ${bookId}`, err);
    }
  } catch (err) {
    console.error(`artJob failed for book ${bookId}`, err);
    book.status = "error";
    await book.save();
    throw err;
  }
}
