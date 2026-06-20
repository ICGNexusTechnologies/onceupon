export const metadata = { title: "Privacy Policy — Once Uponly" };

export default function PrivacyPage() {
  return (
    <div className="wrap" style={{ maxWidth: 760, padding: "56px 28px 90px" }}>
      <h1 className="display-l" style={{ color: "var(--plum)", marginBottom: 16 }}>
        Privacy Policy
      </h1>
      <p style={{ color: "var(--ink-soft)", marginBottom: 24 }}>
        Once Uponly respects your privacy. This page explains what we collect and how we use it.
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>What we collect</h3>
      <p style={{ color: "var(--ink-soft)" }}>
        Account details (name, email), the information you provide to create a book, order and
        shipping details, and standard technical data needed to run the site.
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>Cookies</h3>
      <p style={{ color: "var(--ink-soft)" }}>
        We use a cookie to keep you signed in (essential) and may use cookies to improve your
        experience. You can decline non-essential cookies via the banner.
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>Who we share with</h3>
      <p style={{ color: "var(--ink-soft)" }}>
        Service providers that make the product work — payment processing, book printing and
        shipping, email delivery, and hosting. We do not sell your personal data.
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>Contact</h3>
      <p style={{ color: "var(--ink-soft)" }}>
        Questions? Email us at customersupport@onceuponly.com.
      </p>
    </div>
  );
}
