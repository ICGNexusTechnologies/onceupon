import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Book from "@/models/Book";

export const dynamic = "force-dynamic";

export async function GET() {
  const mongoUriSet = Boolean(process.env.MONGODB_URI);

  try {
    await dbConnect();

    const [coveredCount, latestCovered] = await Promise.all([
      Book.countDocuments({ coverUrl: { $exists: true, $nin: [null, ""] } }),
      Book.findOne({ coverUrl: { $exists: true, $nin: [null, ""] } })
        .sort({ createdAt: -1 })
        .select("title child.name coverUrl status createdAt")
        .lean(),
    ]);

    return NextResponse.json({
      mongoUriSet,
      dbConnected: true,
      coveredCount,
      latestCovered: latestCovered
        ? {
            title: latestCovered.title,
            childName: latestCovered.child?.name ?? null,
            status: latestCovered.status,
            hasCoverUrl: Boolean(latestCovered.coverUrl),
            coverHost: latestCovered.coverUrl ? new URL(latestCovered.coverUrl).hostname : null,
            createdAt: latestCovered.createdAt,
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        mongoUriSet,
        dbConnected: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
