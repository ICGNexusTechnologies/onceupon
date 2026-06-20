import Link from "next/link";
import type { Metadata } from "next";
import Showcase from "@/components/Showcase";
import { getShowcaseBooks, getFeaturedReview } from "@/lib/showcase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Personalized Children's Books Starring Your Child | Once Uponly",
  description:
    "Make a custom, fully-illustrated storybook with your child as the hero — personalize their name, look, and adventure. Delivered as a digital PDF, softcover, or hardcover. The perfect keepsake gift.",
  alternates: { canonical: "/" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://onceuponly.com/#org",
      name: "Once Uponly",
      url: "https://onceuponly.com",
      logo: "https://onceuponly.com/icon.svg",
      description: "Personalized, fully-illustrated children's storybooks starring your child.",
    },
    {
      "@type": "WebSite",
      "@id": "https://onceuponly.com/#website",
      url: "https://onceuponly.com",
      name: "Once Uponly",
      publisher: { "@id": "https://onceuponly.com/#org" },
    },
    {
      "@type": "Product",
      name: "Personalized Storybook",
      description: "A custom, fully-illustrated 40-page children's book starring your child.",
      brand: { "@type": "Brand", name: "Once Uponly" },
      offers: [
        { "@type": "Offer", name: "Digital PDF", price: "19.00", priceCurrency: "USD", availability: "https://schema.org/InStock" },
        { "@type": "Offer", name: "Softcover", price: "34.00", priceCurrency: "USD", availability: "https://schema.org/InStock" },
        { "@type": "Offer", name: "Hardcover", price: "49.00", priceCurrency: "USD", availability: "https://schema.org/InStock" },
      ],
    },
  ],
};

export default async function Home() {
  const [books, featuredReview] = await Promise.all([getShowcaseBooks(), getFeaturedReview()]);
  const hero = books[0];

  return (
    <div className="fade-in">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="hero">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">✦ A keepsake they&apos;ll treasure</span>
            <h1 className="display-xl">
              Personalized storybooks, <em>made just for them.</em>
            </h1>
            <p className="lead">
              Answer a few questions about your child and we&apos;ll craft a beautiful,
              fully-illustrated hardcover starring them.
            </p>
            <div className="hero-cta">
              <Link href="/create" className="btn btn-primary btn-lg">
                Create their book →
              </Link>
              <a href="#how" className="btn btn-ghost btn-lg">
                See how it works
              </a>
            </div>
            <div className="hero-trust">
              <span className="stars-txt">★★★★★</span> Loved by 12,000+ families
            </div>
          </div>
          <div className="book-stage">
            <div className="badge-float badge-1">
              ✏️ Made for {hero?.childName || "Maya"}
            </div>
            <div className="badge-float badge-2">📦 Hardcover keepsake</div>
            <div className="bookcover">
              {hero ? (
                <div
                  className="cover-art cover-photo"
                  style={{ backgroundImage: `url(${hero.coverUrl})` }}
                />
              ) : (
                <div className="cover-art">
                  <div className="moon"></div>
                  <div className="hill"></div>
                  <div className="fig"></div>
                </div>
              )}
              <div className={`title-plate${hero ? " on-photo" : ""}`}>
                {hero ? hero.title : "Maya & the Starlit Sea"}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="band" id="how" style={{ background: "var(--paper-2)" }}>
        <div className="wrap">
          <div className="section-head">
            <h2 className="display-l">How it works</h2>
            <p>A guided story-maker that turns your answers into a one-of-a-kind book.</p>
          </div>
          <div className="steps">
            <div className="step">
              <span className="num">1</span>
              <div className="ic" style={{ background: "#FDEBE5" }}>💬</div>
              <h3>Answer a few questions</h3>
              <p>Your child&apos;s name, look, what they love, and the kind of story you want. Takes 2 minutes.</p>
            </div>
            <div className="step">
              <span className="num">2</span>
              <div className="ic" style={{ background: "#E7F0F3" }}>🪄</div>
              <h3>We write &amp; illustrate it</h3>
              <p>A complete adventure, personalized to every answer you give.</p>
            </div>
            <div className="step">
              <span className="num">3</span>
              <div className="ic" style={{ background: "#FBF0DC" }}>📖</div>
              <h3>Preview, then order</h3>
              <p>See the cover and story free. Love it? Order the hardcover or instant PDF.</p>
            </div>
          </div>
        </div>
      </section>

      <Showcase books={books} />

      {featuredReview && (
        <section className="band">
          <div className="wrap">
            <div className="quote">
              <div className="mark">&quot;</div>
              <blockquote>{featuredReview.body}</blockquote>
              <cite>
                — {featuredReview.userName}
                {featuredReview.verified && " · Verified Purchase"}
              </cite>
            </div>
          </div>
        </section>
      )}

      <section className="band" id="prices" style={{ background: "var(--paper-2)" }}>
        <div className="wrap">
          <div className="section-head">
            <h2 className="display-l">Simple pricing</h2>
            <p>Every book is a full personalized story. Choose how you want it.</p>
          </div>
          <div className="pricing">
            <div className="price-card">
              <h3>Digital PDF</h3>
              <div className="amt">$19</div>
              <p>Print-ready download, delivered instantly. Great for last-minute gifts.</p>
              <Link href="/create" className="btn btn-ghost">Start →</Link>
            </div>
            <div className="price-card feat">
              <div className="pc-tag">MOST LOVED</div>
              <h3>Hardcover</h3>
              <div className="amt">$49</div>
              <p>Premium hardcover keepsake + free PDF. Delivered in 2–4 business days.</p>
              <Link href="/create" className="btn btn-primary">Start →</Link>
            </div>
            <div className="price-card">
              <h3>Softcover</h3>
              <div className="amt">$34</div>
              <p>Lightweight printed book + free PDF. A lovely everyday read.</p>
              <Link href="/create" className="btn btn-ghost">Start →</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="site">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <div className="logo" style={{ color: "#fff", marginBottom: 14 }}>
                <span className="star">✦</span>Once Uponly
              </div>
              <p style={{ color: "#b3a8cc", fontSize: ".9rem", maxWidth: "30ch" }}>
                Personalized storybooks that make every child the hero of their own adventure.
              </p>
            </div>
            <div>
              <h4>Create</h4>
              <Link href="/create">Make a book</Link>
              <a href="#how">How it works</a>
              <a href="#prices">Pricing</a>
            </div>
            <div>
              <h4>Company</h4>
              <Link href="/about">About</Link>
              <Link href="/gift-cards">Gift cards</Link>
              <Link href="/reviews">Reviews</Link>
            </div>
            <div>
              <h4>Help</h4>
              <Link href="/faq">FAQ</Link>
              <Link href="/shipping">Shipping</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/refund">Refunds</Link>
              <Link href="/terms">Terms</Link>
            </div>
          </div>
          <div className="foot-bottom">© 2026 Once Uponly. Made with love (and a little magic).</div>
        </div>
      </footer>
    </div>
  );
}
