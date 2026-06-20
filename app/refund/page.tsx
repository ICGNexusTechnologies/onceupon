export const metadata = { title: "Refund & Cancellation Policy — Once Uponly" };

export default function RefundPage() {
  return (
    <div className="wrap" style={{ maxWidth: 760, padding: "56px 28px 90px" }}>
      <h1 className="display-l" style={{ color: "var(--plum)", marginBottom: 16 }}>
        Refund &amp; Cancellation Policy
      </h1>
      <p style={{ color: "var(--ink-soft)", marginBottom: 24 }}>
        Every Once Uponly book is personalized and printed to order, so our policy balances that with
        making sure you&rsquo;re always taken care of if something goes wrong. If you&rsquo;re ever
        unhappy with your order, email us at customersupport@onceuponly.com and we&rsquo;ll make it
        right.
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>Cancellations</h3>
      <p style={{ color: "var(--ink-soft)" }}>
        You can cancel an order for a full refund any time <strong>before it enters production</strong>
        (before printing begins). Once a personalized book has been sent to print, it can no longer be
        cancelled because it&rsquo;s made uniquely for you. To cancel, email
        customersupport@onceuponly.com with your order number as soon as possible.
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>Printed books (hardcover &amp; softcover)</h3>
      <p style={{ color: "var(--ink-soft)" }}>
        Because printed books are personalized, we can&rsquo;t accept returns for buyer&rsquo;s
        remorse. However, we&rsquo;ll send a <strong>free replacement or a full refund</strong> if your
        book arrives damaged, has a printing or binding defect, or you received the wrong item. Just
        email us within <strong>14 days</strong> of delivery at customersupport@onceuponly.com with
        your order number and a photo of the issue.
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>Digital PDFs</h3>
      <p style={{ color: "var(--ink-soft)" }}>
        Digital books are personalized and delivered instantly, so they&rsquo;re generally
        non-refundable once generated. If there&rsquo;s a problem with your file or the personalization
        is wrong, contact us and we&rsquo;ll fix it or issue a refund.
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>How refunds are issued</h3>
      <p style={{ color: "var(--ink-soft)" }}>
        Approved refunds are returned to your original payment method, typically within 5&ndash;10
        business days depending on your bank or card issuer.
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>Contact</h3>
      <p style={{ color: "var(--ink-soft)" }}>
        Questions about a refund or cancellation? Email us at customersupport@onceuponly.com and
        we&rsquo;ll be glad to help.
      </p>
    </div>
  );
}
