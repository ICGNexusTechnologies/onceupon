import { ImageResponse } from "next/og";
import { getShowcaseBooks } from "@/lib/showcase";

export const alt = "Once Uponly — personalized storybooks for kids";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Rich social-share card: a real book cover beside the value prop.
export default async function OpengraphImage() {
  let cover = "";
  try {
    const books = await getShowcaseBooks(1);
    cover = books[0]?.coverUrl || "";
  } catch {
    // fall back to the text-only card below
  }
  const coverSrc =
    cover && cover.includes("/image/upload/")
      ? cover.replace("/image/upload/", "/image/upload/w_520,h_650,c_fill,q_auto/")
      : cover;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: 64,
          background: "linear-gradient(135deg, #FBF4E6 0%, #FCE0D2 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <div style={{ width: 38, height: 38, borderRadius: 999, background: "#E8A33D" }} />
            <div style={{ fontSize: 40, fontWeight: 800, color: "#3A2A5C", letterSpacing: -1 }}>Once Uponly</div>
          </div>
          <div style={{ fontSize: 60, fontWeight: 800, color: "#3A2A5C", lineHeight: 1.08, letterSpacing: -1 }}>
            Your child, the hero of their own storybook.
          </div>
          <div style={{ fontSize: 26, color: "#5A4E6E", marginTop: 22, lineHeight: 1.3 }}>
            Custom, fully-illustrated books — made just for them.
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 30, fontSize: 22, fontWeight: 700, color: "#fff" }}>
            <div style={{ background: "#E0654E", borderRadius: 999, padding: "9px 24px" }}>Digital</div>
            <div style={{ background: "#E0654E", borderRadius: 999, padding: "9px 24px" }}>Softcover</div>
            <div style={{ background: "#E0654E", borderRadius: 999, padding: "9px 24px" }}>Hardcover</div>
          </div>
        </div>
        {coverSrc ? (
          <img
            src={coverSrc}
            width={360}
            height={450}
            style={{
              borderRadius: 14,
              boxShadow: "0 30px 60px rgba(58,42,92,0.35)",
              objectFit: "cover",
              transform: "rotate(2deg)",
            }}
          />
        ) : null}
      </div>
    ),
    { ...size }
  );
}
