export const metadata = { title: "Contact — Once Uponly" };

export default function ContactPage() {
  return (
    <div className="wrap" style={{ maxWidth: 640, padding: "56px 28px 90px" }}>
      <h1 className="display-l" style={{ color: "var(--plum)", marginBottom: 16 }}>
        Get in touch
      </h1>
      <p style={{ color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: 28 }}>
        We'd love to hear from you — questions, order help, or just to say hi.
      </p>

      <div className="buy-card">
        <h3 style={{ marginTop: 0, color: "var(--plum)" }}>Email us</h3>
        <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
          <a href="mailto:customersupport@onceuponly.com" style={{ color: "var(--coral)", fontWeight: 700 }}>
            customersupport@onceuponly.com
          </a>
        </p>
        <p style={{ color: "var(--ink-soft)", fontSize: ".9rem", marginTop: 12, marginBottom: 0 }}>
          We typically reply within 1–2 business days. For help with an existing order, please
          include your <strong>order number</strong> (it starts with “OU-”) so we can find it fast.
        </p>
      </div>
    </div>
  );
}
