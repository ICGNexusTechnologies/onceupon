import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Review, { type IReview } from "@/models/Review";
import { getAdminSession } from "@/lib/admin";

/** GET /api/admin/reviews — all reviews incl. hidden (admin only). */
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const reviews = (await Review.find({})
    .sort({ featured: -1, createdAt: -1 })
    .lean()) as unknown as IReview[];
  const data = reviews.map((r) => ({
    id: String(r._id),
    userName: r.userName,
    rating: r.rating,
    body: r.body,
    verified: r.verified,
    hidden: !!r.hidden,
    featured: !!r.featured,
    createdAt: r.createdAt,
  }));
  return NextResponse.json({ reviews: data });
}

/** POST /api/admin/reviews — moderate. Body: { id, action: hide|show|feature|unfeature|delete } */
export async function POST(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, action } = (await req.json()) as { id?: string; action?: string };
  if (!id) return NextResponse.json({ error: "Missing review id" }, { status: 400 });

  await dbConnect();

  if (action === "delete") {
    await Review.findByIdAndDelete(id);
    return NextResponse.json({ ok: true, message: "Review deleted" });
  }

  const update: Partial<Pick<IReview, "hidden" | "featured">> = {};
  if (action === "hide") update.hidden = true;
  else if (action === "show") update.hidden = false;
  else if (action === "feature") update.featured = true;
  else if (action === "unfeature") update.featured = false;
  else return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  await Review.findByIdAndUpdate(id, update);
  return NextResponse.json({ ok: true, message: "Review updated" });
}
