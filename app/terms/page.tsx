export const metadata = { title: "Terms of Service — Once Uponly" };

export default function TermsPage() {
  return (
    <div className="wrap" style={{ maxWidth: 760, padding: "56px 28px 90px" }}>
      <h1 className="display-l" style={{ color: "var(--plum)", marginBottom: 16 }}>
        Terms of Service
      </h1>
      <p style={{ color: "var(--ink-soft)", marginBottom: 24 }}>
        These terms govern your use of Once Uponly (onceuponly.com) and the personalized storybooks we
        create. By using the site or placing an order, you agree to them.
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>What we provide</h3>
      <p style={{ color: "var(--ink-soft)" }}>
        Once Uponly creates personalized children&rsquo;s storybooks, available as a digital PDF or a
        printed softcover or hardcover book, using the details you provide.
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>Your account</h3>
      <p style={{ color: "var(--ink-soft)" }}>
        You&rsquo;re responsible for the accuracy of the information you provide and for keeping your
        login secure. You must be at least 18 to make a purchase.
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>Orders &amp; payment</h3>
      <p style={{ color: "var(--ink-soft)" }}>
        Prices are shown in USD and payment is processed securely by Stripe. By placing an order you
        authorize us to charge your payment method for the total shown, including any applicable
        shipping and taxes.
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>Personalized content</h3>
      <p style={{ color: "var(--ink-soft)" }}>
        You confirm that you have the right to use any names, likenesses, or details you submit to
        personalize a book, and that the content is appropriate. Because each book is custom-made,
        please review your details carefully before ordering. See our{" "}
        <a href="/refund" style={{ color: "var(--coral)", fontWeight: 700 }}>
          Refund &amp; Cancellation Policy
        </a>{" "}
        for how returns and refunds work.
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>Intellectual property</h3>
      <p style={{ color: "var(--ink-soft)" }}>
        The Once Uponly site, branding, and book templates are our property. You receive a personal,
        non-commercial license to the finished book you purchase for your own family use.
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>Acceptable use</h3>
      <p style={{ color: "var(--ink-soft)" }}>
        Don&rsquo;t use the service to create unlawful, harmful, or infringing content, or to disrupt
        the site. We may decline or cancel orders that violate these terms.
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>Limitation of liability</h3>
      <p style={{ color: "var(--ink-soft)" }}>
        The service is provided &ldquo;as is.&rdquo; To the extent permitted by law, Once Uponly is not
        liable for indirect or incidental damages. Our total liability for any order is limited to the
        amount you paid for it.
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>Changes</h3>
      <p style={{ color: "var(--ink-soft)" }}>
        We may update these terms from time to time. Continued use of the site means you accept the
        current version.
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>Contact</h3>
      <p style={{ color: "var(--ink-soft)" }}>
        Questions about these terms? Email us at customersupport@onceuponly.com.
      </p>
    </div>
  );
}
