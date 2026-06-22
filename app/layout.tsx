import type { Metadata } from "next";
import { Fraunces, Nunito } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import CookieBanner from "@/components/CookieBanner";
import VerifyBanner from "@/components/VerifyBanner";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://onceuponly.com"),
  title: "Once Uponly — Personalized storybooks, made just for them",
  description:
    "Create a personalized, fully-illustrated children's book starring your child. Answer a few questions and we'll craft a custom storybook — digital PDF, softcover, or hardcover. Ships across the US.",
  keywords: [
    "personalized children's book",
    "custom storybook",
    "personalized kids book",
    "book with my child's name",
    "custom children's book gift",
    "personalized story book for kids",
    "AI children's book",
  ],
  applicationName: "Once Uponly",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Once Uponly",
    title: "Once Uponly — Personalized storybooks, made just for them",
    description:
      "A custom, fully-illustrated storybook starring your child — the perfect keepsake gift. Digital, softcover, or hardcover.",
    url: "https://onceuponly.com",
    // Static, CDN-served card (not generated per-request) so mobile link
    // scrapers never time out and fall back to a page screenshot.
    images: [{ url: "/og.jpg", width: 1200, height: 630, type: "image/jpeg", alt: "Once Uponly — personalized storybooks for kids" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Once Uponly — Personalized storybooks, made just for them",
    description: "A custom, fully-illustrated storybook starring your child — the perfect keepsake gift.",
    images: ["/og.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${nunito.variable}`}>
      <body>
        <Nav />
        <VerifyBanner />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
