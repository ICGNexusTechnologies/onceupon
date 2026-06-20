export const metadata = { title: "Shipping — Once Uponly" };

export default function ShippingPage() {
  return (
    <div className="wrap" style={{ maxWidth: 760, padding: "56px 28px 90px" }}>
      <h1 className="display-l" style={{ color: "var(--plum)", marginBottom: 24 }}>
        Shipping & delivery
      </h1>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>Where we ship</h3>
      <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
        We currently ship printed books within the <strong>United States</strong>. (More regions
        coming soon.)
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>How long it takes</h3>
      <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
        Every book is printed to order. Printing and dispatch typically take{" "}
        <strong>2–4 business days</strong>, and delivery usually adds another{" "}
        <strong>3–7 business days</strong> depending on your location — so most orders arrive within
        about 1–2 weeks.
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>Shipping cost</h3>
      <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
        Shipping is included in the price of your printed book — no surprise fees at checkout.
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>Tracking</h3>
      <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
        Once your book ships, we'll email you a tracking link so you can follow it to your door. You
        can also check the status anytime from your order page.
      </p>

      <h3 style={{ color: "var(--plum)", marginTop: 28 }}>Digital books</h3>
      <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
        The Digital PDF has no shipping — it's available to download as soon as your book finishes
        generating.
      </p>

      <p style={{ color: "var(--ink-soft)", marginTop: 36 }}>
        Questions about a delivery? Email us at customersupport@onceuponly.com.
      </p>
    </div>
  );
}
