import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { getAdminSession } from "@/lib/admin";
import { getGelatoOrderType, setGelatoOrderType } from "@/lib/settings";

/** GET /api/admin/config — current runtime config (admin only). */
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await dbConnect();
  return NextResponse.json({ gelatoOrderType: await getGelatoOrderType() });
}

/** POST /api/admin/config — update runtime config. Body: { gelatoOrderType: "order"|"draft" } */
export async function POST(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { gelatoOrderType } = (await req.json()) as { gelatoOrderType?: string };
  if (gelatoOrderType !== "order" && gelatoOrderType !== "draft") {
    return NextResponse.json({ error: "gelatoOrderType must be 'order' or 'draft'" }, { status: 400 });
  }

  await dbConnect();
  await setGelatoOrderType(gelatoOrderType);
  return NextResponse.json({
    ok: true,
    gelatoOrderType,
    message: `Gelato mode set to ${gelatoOrderType === "order" ? "auto-production" : "draft (review first)"}`,
  });
}
