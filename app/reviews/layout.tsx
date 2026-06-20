import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reviews — What Families Say About Once Uponly",
  description:
    "Read reviews from families who created personalized storybooks with Once Uponly — custom children's books starring their own kids.",
  alternates: { canonical: "/reviews" },
};

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
