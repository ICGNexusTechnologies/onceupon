import type { MetadataRoute } from "next";

const BASE = "https://onceuponly.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: { path: string; priority: number; freq: "weekly" | "monthly" }[] = [
    { path: "", priority: 1.0, freq: "weekly" },
    { path: "/about", priority: 0.8, freq: "monthly" },
    { path: "/reviews", priority: 0.7, freq: "weekly" },
    { path: "/gift-cards", priority: 0.8, freq: "monthly" },
    { path: "/faq", priority: 0.6, freq: "monthly" },
    { path: "/shipping", priority: 0.5, freq: "monthly" },
    { path: "/contact", priority: 0.5, freq: "monthly" },
    { path: "/privacy", priority: 0.3, freq: "monthly" },
    { path: "/terms", priority: 0.3, freq: "monthly" },
    { path: "/refund", priority: 0.3, freq: "monthly" },
  ];
  return routes.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }));
}
