import { dbConnect } from "@/lib/db";
import Book from "@/models/Book";
import Review from "@/models/Review";
import { generateSynopsis } from "@/lib/story";

export interface FeaturedReview {
  body: string;
  userName: string;
  verified: boolean;
}

export async function getFeaturedReview(): Promise<FeaturedReview | null> {
  try {
    await dbConnect();
    const review = await Review.findOne({ rating: 5 })
      .sort({ createdAt: -1 })
      .select("body userName verified")
      .lean();
    if (!review) return null;
    return { body: review.body, userName: review.userName, verified: review.verified };
  } catch {
    return null;
  }
}

export interface ShowcaseBook {
  id: string;
  title: string;
  childName: string;
  coverUrl: string;
  synopsis: string;
}

/** Recent books with covers, for the public landing page. Synopses are
 *  generated once with Haiku and cached on the Book document. */
export async function getShowcaseBooks(limit = 6): Promise<ShowcaseBook[]> {
  try {
    await dbConnect();
    const books = await Book.find({ coverUrl: { $exists: true, $nin: [null, ""] } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("title coverUrl synopsis child.name tone world value pages");

    const result: ShowcaseBook[] = [];
    for (const b of books) {
      let synopsis = b.synopsis;
      if (!synopsis) {
        try {
          synopsis = await generateSynopsis(
            b.title,
            b.pages.map((p) => p.text).join(" ")
          );
        } catch {
          synopsis = `A ${b.tone || "heartwarming"} adventure in ${b.world || "a magical world"}, all about ${b.value || "courage"} — starring ${b.child?.name || "one brave kid"}.`;
        }
        b.synopsis = synopsis;
        await b.save().catch(() => {});
      }
      result.push({
        id: String(b._id),
        title: b.title,
        childName: b.child?.name || "",
        coverUrl: b.coverUrl!,
        synopsis,
      });
    }
    return result;
  } catch {
    return []; // landing page must render even if the DB is unreachable
  }
}
