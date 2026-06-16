import Link from "next/link";

export const metadata = { title: "FAQ — Once Upon" };

const FAQS = [
  {
    q: "How does it work?",
    a: "Answer a few quick questions about your child — their name, what they look like, and what they love. We write a one-of-a-kind 40-page story starring them and illustrate every page in the art style you choose.",
  },
  {
    q: "Can I see it before I pay?",
    a: "Yes. You get a free preview of the cover and the full story before checkout. You only pay once you're happy with it.",
  },
  {
    q: "How long does it take?",
    a: "The story and cover preview are ready in a couple of minutes. After you order, the full set of illustrations is generated — this usually takes a few minutes, and your book page fills in as each page finishes.",
  },
  {
    q: "What formats can I get?",
    a: "Digital PDF ($19), Softcover + PDF ($34), and Hardcover + PDF ($49). Every option includes the print-ready digital PDF.",
  },
  {
    q: "How personalized is the book really?",
    a: "Very — your child is the hero on every page. Their name, appearance, and the things they love are woven through the whole story.",
  },
  {
    q: "What ages is it for?",
    a: "It's designed for young children, roughly ages 2–8. You pick the age during creation so the vocabulary and tone fit.",
  },
  {
    q: "How is my book delivered?",
    a: "Digital PDFs are available to download right after they're generated. Printed books are made to order and shipped to you — see our Shipping page for details.",
  },
  {
    q: "Something's wrong with my order — what do I do?",
    a: "Reach out to customersupport@onceuponly.com with your order number and we'll make it right.",
  },
];

export default function FAQPage() {
  return (
    <div className="wrap" style={{ maxWidth: 760, padding: "56px 28px 90px" }}>
      <h1 className="display-l" style={{ color: "var(--plum)", marginBottom: 28 }}>
        Frequently asked questions
      </h1>
      {FAQS.map((f, i) => (
        <div key={i} style={{ marginBottom: 26 }}>
          <h3 style={{ color: "var(--plum)", marginBottom: 6 }}>{f.q}</h3>
          <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>{f.a}</p>
        </div>
      ))}
      <p style={{ color: "var(--ink-soft)", marginTop: 36 }}>
        Still have a question?{" "}
        <Link href="/contact" style={{ color: "var(--coral)", fontWeight: 700 }}>
          Get in touch →
        </Link>
      </p>
    </div>
  );
}
