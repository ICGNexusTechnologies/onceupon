import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Once Upon",
  description:
    "We believe every child deserves to be the hero of their own story. Learn how Once Upon crafts personalized, illustrated storybooks for families.",
};

export default function AboutPage() {
  return (
    <div className="fade-in">
      {/* Hero */}
      <header className="hero" style={{ padding: "80px 0 100px" }}>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="wrap" style={{ maxWidth: 780, textAlign: "center" }}>
          <span className="eyebrow">✦ Our story</span>
          <h1 className="display-xl" style={{ marginTop: 18 }}>
            Every child deserves to be the <em>hero.</em>
          </h1>
          <p className="lead" style={{ maxWidth: "44ch", margin: "24px auto 0" }}>
            We started Once Upon with one idea: the most magical book a child can
            read is one where they are the main character.
          </p>
        </div>
      </header>

      {/* Origin story */}
      <section className="band" style={{ background: "var(--paper-2)" }}>
        <div className="wrap" style={{ maxWidth: 820 }}>
          <div className="split-grid">
            <div>
              <span className="eyebrow" style={{ marginBottom: 18, display: "inline-flex" }}>
                ✦ How it started
              </span>
              <h2 className="display-l" style={{ marginBottom: 20 }}>
                A bedtime story that didn&apos;t exist yet
              </h2>
              <p style={{ color: "var(--ink-soft)", lineHeight: 1.75, marginBottom: 16 }}>
                It started the way most good ideas do — at bedtime. A parent reading to their
                daughter, wishing there was a book where she was the one going on the adventure.
                Not a princess with her name swapped in, but a story shaped around who she
                actually is: her laugh, her love of dinosaurs, her best friend&apos;s name.
              </p>
              <p style={{ color: "var(--ink-soft)", lineHeight: 1.75 }}>
                We built Once Upon to make that book. For every child. In minutes.
              </p>
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, var(--plum), #27184a)",
                borderRadius: 28,
                padding: "50px 40px",
                color: "#fff",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: 20,
                  top: -30,
                  fontSize: "11rem",
                  color: "rgba(255,255,255,.06)",
                  fontFamily: "var(--display)",
                  lineHeight: 1,
                }}
              >
                ✦
              </div>
              <p
                style={{
                  fontFamily: "var(--display)",
                  fontStyle: "italic",
                  fontSize: "1.35rem",
                  lineHeight: 1.45,
                  color: "#fff",
                  position: "relative",
                  zIndex: 1,
                  marginBottom: 20,
                }}
              >
                &ldquo;She held the book up to me and said, &lsquo;Daddy, that&apos;s me on the
                cover.&rsquo; I&apos;ll never forget that look on her face.&rdquo;
              </p>
              <p style={{ color: "#d8cdf0", fontSize: ".88rem", fontWeight: 700, position: "relative", zIndex: 1 }}>
                — Marcus T., dad of two
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="band">
        <div className="wrap">
          <div className="section-head">
            <h2 className="display-l">What we believe</h2>
            <p>Three things guide every book we make.</p>
          </div>
          <div className="steps">
            <div className="step">
              <span className="num">01</span>
              <div className="ic" style={{ background: "#FDEBE5" }}>🌟</div>
              <h3>Personalization is the point</h3>
              <p style={{ color: "var(--ink-soft)" }}>
                Every detail — your child&apos;s name, look, personality, the places they love —
                shapes the story. No two books are the same.
              </p>
            </div>
            <div className="step">
              <span className="num">02</span>
              <div className="ic" style={{ background: "#E7F0F3" }}>🎨</div>
              <h3>Quality that lasts a lifetime</h3>
              <p style={{ color: "var(--ink-soft)" }}>
                From the writing to the illustrations to the hardcover binding, we treat every
                book like the keepsake it is.
              </p>
            </div>
            <div className="step">
              <span className="num">03</span>
              <div className="ic" style={{ background: "#FBF0DC" }}>💛</div>
              <h3>Joy in every page</h3>
              <p style={{ color: "var(--ink-soft)" }}>
                Stories should feel warm, funny, and full of wonder. We write for the child and
                the parent reading over their shoulder.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How the magic works */}
      <section className="band" style={{ background: "var(--paper-2)" }}>
        <div className="wrap" style={{ maxWidth: 820 }}>
          <div className="section-head">
            <h2 className="display-l">A little magic, a lot of care</h2>
            <p>
              We combine storytelling craft with AI to create books that feel hand-written,
              not generated.
            </p>
          </div>
          <div className="card feature-grid">
            <div>
              <div style={{ fontSize: "2rem", marginBottom: 14 }}>✍️</div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: 10 }}>Story first</h3>
              <p style={{ color: "var(--ink-soft)", lineHeight: 1.7 }}>
                Every story follows a real narrative arc — a call to adventure, a challenge,
                a moment of courage, a warm resolution. Your answers don&apos;t just fill in blanks;
                they shape the whole plot.
              </p>
            </div>
            <div>
              <div style={{ fontSize: "2rem", marginBottom: 14 }}>🖼️</div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: 10 }}>Illustrations that match</h3>
              <p style={{ color: "var(--ink-soft)", lineHeight: 1.7 }}>
                Each page gets its own original illustration — painted to match the scene,
                the character&apos;s look, and the mood of the moment. No stock art, no reuse.
              </p>
            </div>
            <div>
              <div style={{ fontSize: "2rem", marginBottom: 14 }}>🖨️</div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: 10 }}>Printed with pride</h3>
              <p style={{ color: "var(--ink-soft)", lineHeight: 1.7 }}>
                Hardcovers are printed on thick, premium paper with a durable lay-flat binding.
                Built to survive sticky fingers and a hundred re-reads.
              </p>
            </div>
            <div>
              <div style={{ fontSize: "2rem", marginBottom: 14 }}>⚡</div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: 10 }}>Ready when you are</h3>
              <p style={{ color: "var(--ink-soft)", lineHeight: 1.7 }}>
                Preview the full story in minutes. Order the print and it ships in 2–4
                business days — or grab the PDF instantly for tonight.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="band">
        <div className="wrap">
          <div className="quote">
            <div className="mark">&quot;</div>
            <blockquote>
              I ordered it as a birthday gift and cried when it arrived. It was perfect in every single way.
            </blockquote>
            <cite>— Priya M., mom of three</cite>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="band" style={{ background: "var(--paper-2)" }}>
        <div className="wrap">
          <div className="stats-grid">
            {[
              { num: "12,000+", label: "Families served" },
              { num: "50,000+", label: "Books created" },
              { num: "★ 4.9", label: "Average rating" },
            ].map(({ num, label }) => (
              <div
                key={label}
                style={{
                  background: "#fff",
                  borderRadius: 22,
                  padding: "36px 24px",
                  boxShadow: "0 10px 30px var(--shadow)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: "2.8rem",
                    fontWeight: 700,
                    color: "var(--coral)",
                    lineHeight: 1,
                    marginBottom: 10,
                  }}
                >
                  {num}
                </div>
                <div style={{ color: "var(--ink-soft)", fontWeight: 700 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="band">
        <div className="wrap" style={{ textAlign: "center" }}>
          <span className="eyebrow" style={{ marginBottom: 20, display: "inline-flex" }}>
            ✦ Ready to start?
          </span>
          <h2 className="display-l" style={{ marginBottom: 16 }}>
            Make their book today
          </h2>
          <p style={{ color: "var(--ink-soft)", maxWidth: "38ch", margin: "0 auto 32px", fontSize: "1.1rem" }}>
            Takes about 2 minutes. Preview for free. Print only if you love it.
          </p>
          <Link href="/create" className="btn btn-primary btn-lg">
            Create their book →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="site">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <div className="logo" style={{ color: "#fff", marginBottom: 14 }}>
                <span className="star">✦</span>Once Upon
              </div>
              <p style={{ color: "#b3a8cc", fontSize: ".9rem", maxWidth: "30ch" }}>
                Personalized storybooks that make every child the hero of their own adventure.
              </p>
            </div>
            <div>
              <h4>Create</h4>
              <Link href="/create">Make a book</Link>
              <Link href="/#how">How it works</Link>
              <Link href="/#prices">Pricing</Link>
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
            </div>
          </div>
          <div className="foot-bottom">© 2026 Once Upon. Made with love.</div>
        </div>
      </footer>
    </div>
  );
}
