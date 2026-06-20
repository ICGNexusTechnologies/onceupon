import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gift Cards — Give a Personalized Storybook | Once Upon",
  description:
    "Give the gift of a personalized children's book. An Once Upon gift card lets someone create a custom storybook starring their child — digital, softcover, or hardcover.",
  alternates: { canonical: "/gift-cards" },
};

export default function GiftCardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
