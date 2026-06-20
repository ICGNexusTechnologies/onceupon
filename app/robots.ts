import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private / transactional / gated routes out of the index.
      disallow: [
        "/api/",
        "/admin",
        "/dashboard",
        "/settings",
        "/orders",
        "/checkout",
        "/book/",
        "/create",
        "/auth",
        "/verify-email",
        "/reset-password",
        "/forgot-password",
        "/image-test",
      ],
    },
    sitemap: "https://onceuponly.com/sitemap.xml",
    host: "https://onceuponly.com",
  };
}
