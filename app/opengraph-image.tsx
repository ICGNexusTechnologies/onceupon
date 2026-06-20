import { ImageResponse } from "next/og";

export const alt = "Once Upon — personalized storybooks for kids";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default social-share card (shown when onceuponly.com is shared anywhere).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FBF4E6",
          color: "#3A2A5C",
          fontFamily: "sans-serif",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 999, background: "#E8A33D" }} />
          <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -1 }}>Once Upon</div>
        </div>
        <div style={{ fontSize: 52, fontWeight: 800, textAlign: "center", lineHeight: 1.15, maxWidth: 900 }}>
          Personalized storybooks, made just for them
        </div>
        <div style={{ fontSize: 30, color: "#5A4E6E", textAlign: "center", marginTop: 24, maxWidth: 820 }}>
          A custom, fully-illustrated book starring your child
        </div>
        <div
          style={{
            marginTop: 40,
            display: "flex",
            gap: 14,
            fontSize: 24,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          <div style={{ background: "#E0654E", borderRadius: 999, padding: "10px 26px" }}>Digital</div>
          <div style={{ background: "#E0654E", borderRadius: 999, padding: "10px 26px" }}>Softcover</div>
          <div style={{ background: "#E0654E", borderRadius: 999, padding: "10px 26px" }}>Hardcover</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
