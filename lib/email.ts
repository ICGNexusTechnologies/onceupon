import { Resend } from "resend";

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";
const APP_URL = () => process.env.APP_URL || "http://localhost:3000";

export async function sendGiftCardEmail({
  recipientEmail,
  recipientName,
  purchaserEmail,
  message,
  code,
  amountCents,
}: {
  recipientEmail: string;
  recipientName: string;
  purchaserEmail?: string;
  message?: string;
  code: string;
  amountCents: number;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping gift card email to", recipientEmail);
    return;
  }

  const amount = `$${Math.round(amountCents / 100)}`;

  await resend.emails.send({
    from: FROM,
    to: recipientEmail,
    subject: `You've received a ${amount} Once Uponly gift card 🎁`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:36px 24px;background:#FBF4E6;border-radius:16px">
        <h1 style="color:#3A2A5C;font-size:1.8rem;margin:0 0 8px">You've got a gift! 🌟</h1>
        ${purchaserEmail ? `<p style="color:#5A4E6E;margin:0 0 16px">Someone special sent you a Once Uponly gift card.</p>` : ""}
        ${message ? `<blockquote style="border-left:4px solid #E8A33D;padding:12px 16px;margin:20px 0;color:#3A2A5C;font-style:italic;background:#fff;border-radius:0 8px 8px 0">${message}</blockquote>` : ""}
        <div style="background:#fff;border-radius:12px;padding:28px;text-align:center;margin:24px 0;border:2px dashed #E8A33D">
          <p style="color:#5A4E6E;margin:0 0 8px;font-weight:700;font-size:.9rem;letter-spacing:.05em;text-transform:uppercase">Your gift card code</p>
          <p style="font-size:2.2rem;font-weight:900;letter-spacing:.12em;color:#E0654E;margin:0 0 8px;font-family:monospace">${code}</p>
          <p style="color:#5A4E6E;font-size:.9rem;margin:0">Value: ${amount}</p>
        </div>
        <p style="color:#5A4E6E;margin:0 0 24px">Use your code at checkout when ordering a personalized storybook — the perfect gift for any little one.</p>
        <a href="${APP_URL()}/create" style="display:inline-block;background:#E0654E;color:#fff;padding:14px 28px;border-radius:999px;font-weight:700;text-decoration:none">Create a book →</a>
        <p style="color:#9B92B3;font-size:.8rem;margin-top:28px">Once Uponly · Personalized storybooks for every child</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping password reset email to", to);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your Once Uponly password",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:36px 24px;background:#FBF4E6;border-radius:16px">
        <h1 style="color:#3A2A5C;font-size:1.6rem;margin:0 0 8px">Reset your password 🔑</h1>
        <p style="color:#5A4E6E;margin:0 0 24px">We received a request to reset your Once Uponly password. Click the button below to choose a new one. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#E0654E;color:#fff;padding:14px 28px;border-radius:999px;font-weight:700;text-decoration:none">Reset password →</a>
        <p style="color:#5A4E6E;font-size:.88rem;margin-top:24px">If you didn't request this, you can safely ignore this email — your password won't change.</p>
        <p style="color:#9B92B3;font-size:.8rem;margin-top:28px">Once Uponly · Personalized storybooks for every child</p>
      </div>
    `,
  });
}

export async function sendAdminGrantedEmail({
  to,
  name,
  needsMfa,
}: {
  to: string;
  name?: string;
  needsMfa: boolean;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping admin-granted email to", to);
    return;
  }

  // If they still need two-factor, send them straight to the setup screen;
  // otherwise drop them right into the dashboard.
  const ctaUrl = needsMfa ? `${APP_URL()}/settings?mfa=setup#security` : `${APP_URL()}/admin`;
  const ctaLabel = needsMfa ? "Set up two-factor →" : "Open the dashboard →";

  await resend.emails.send({
    from: FROM,
    to,
    subject: "You've been given admin access to Once Uponly",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:36px 24px;background:#FBF4E6;border-radius:16px">
        <h1 style="color:#3A2A5C;font-size:1.6rem;margin:0 0 8px">You're an admin now 🔐</h1>
        <p style="color:#5A4E6E;margin:0 0 16px">Hi${name ? " " + name : ""}, you've been granted admin access to the Once Uponly dashboard.</p>
        ${
          needsMfa
            ? `<p style="color:#5A4E6E;margin:0 0 24px">For security, admins must turn on two-factor authentication before the dashboard will open. Click below to set it up now — it takes about a minute with any authenticator app.</p>`
            : `<p style="color:#5A4E6E;margin:0 0 24px">You're all set — your account already has two-factor enabled, so you can jump straight in.</p>`
        }
        <a href="${ctaUrl}" style="display:inline-block;background:#E0654E;color:#fff;padding:14px 28px;border-radius:999px;font-weight:700;text-decoration:none">${ctaLabel}</a>
        <p style="color:#9B92B3;font-size:.8rem;margin-top:28px">Once Uponly · Personalized storybooks for every child</p>
      </div>
    `,
  });
}

export async function sendVerificationEmail({
  to,
  name,
  verifyUrl,
}: {
  to: string;
  name?: string;
  verifyUrl: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping verification email to", to);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your email — Once Uponly",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:36px 24px;background:#FBF4E6;border-radius:16px">
        <h1 style="color:#3A2A5C;font-size:1.6rem;margin:0 0 8px">Confirm your email ✨</h1>
        <p style="color:#5A4E6E;margin:0 0 24px">${name ? `Hi ${name}, ` : ""}thanks for joining Once Uponly! Please confirm your email so we can send your order and shipping updates. This link expires in 24 hours.</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#E0654E;color:#fff;padding:14px 28px;border-radius:999px;font-weight:700;text-decoration:none">Verify my email →</a>
        <p style="color:#5A4E6E;font-size:.88rem;margin-top:24px">If you didn't create an account, you can safely ignore this email.</p>
        <p style="color:#9B92B3;font-size:.8rem;margin-top:28px">Once Uponly · Personalized storybooks for every child</p>
      </div>
    `,
  });
}

export async function sendShipmentEmail({
  to,
  bookId,
  orderNumber,
  bookTitle,
  carrier,
  trackingCode,
  trackingUrl,
}: {
  to: string;
  bookId: string;
  orderNumber?: string;
  bookTitle: string;
  carrier?: string;
  trackingCode?: string;
  trackingUrl?: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping shipment email to", to);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your Once Uponly book has shipped${bookTitle ? ` — ${bookTitle}` : ""} 🚚`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:36px 24px;background:#FBF4E6;border-radius:16px">
        <h1 style="color:#3A2A5C;font-size:1.8rem;margin:0 0 8px">It's on the way! 🚚</h1>
        <p style="color:#5A4E6E;margin:0 0 24px">Great news — ${bookTitle ? `<strong>${bookTitle}</strong>` : "your book"} has been printed and shipped to your address.${orderNumber ? ` (Order ${orderNumber})` : ""}</p>
        ${
          trackingCode || carrier
            ? `<div style="background:#fff;border-radius:12px;padding:24px;margin:24px 0;text-align:center">
                ${carrier ? `<p style="color:#5A4E6E;margin:0 0 6px;font-weight:700;font-size:.85rem;letter-spacing:.05em;text-transform:uppercase">${carrier}</p>` : ""}
                ${trackingCode ? `<p style="font-size:1.3rem;font-weight:900;letter-spacing:.06em;color:#E0654E;margin:0;font-family:monospace">${trackingCode}</p>` : ""}
               </div>`
            : ""
        }
        ${
          trackingUrl
            ? `<a href="${trackingUrl}" style="display:inline-block;background:#E0654E;color:#fff;padding:14px 28px;border-radius:999px;font-weight:700;text-decoration:none">Track your package →</a>`
            : `<a href="${APP_URL()}/orders/${bookId}" style="display:inline-block;background:#E0654E;color:#fff;padding:14px 28px;border-radius:999px;font-weight:700;text-decoration:none">View your order →</a>`
        }
        <p style="color:#9B92B3;font-size:.8rem;margin-top:28px">Once Uponly · Personalized storybooks for every child</p>
      </div>
    `,
  });
}

export async function sendOrderConfirmationEmail({
  to,
  bookId,
  orderNumber,
  bookTitle,
  childName,
  format,
  amountCents,
  isUpgrade,
}: {
  to: string;
  bookId: string;
  orderNumber?: string;
  bookTitle: string;
  childName?: string;
  format?: string;
  amountCents: number;
  isUpgrade?: boolean;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping order confirmation email to", to);
    return;
  }

  const amount = `$${(amountCents / 100).toFixed(2)}`;
  const heading = isUpgrade ? "Your order has been updated 📦" : "Thanks for your order! 🎉";
  const intro = isUpgrade
    ? "We've received your upgrade — here are the details."
    : "We've received your payment and your personalized storybook is on its way to being created.";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your Once Uponly order is confirmed${bookTitle ? ` — ${bookTitle}` : ""} 📖`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:36px 24px;background:#FBF4E6;border-radius:16px">
        <h1 style="color:#3A2A5C;font-size:1.8rem;margin:0 0 8px">${heading}</h1>
        <p style="color:#5A4E6E;margin:0 0 24px">${intro}</p>
        <div style="background:#fff;border-radius:12px;padding:24px;margin:24px 0">
          <table style="width:100%;border-collapse:collapse;color:#3A2A5C">
            ${orderNumber ? `<tr><td style="padding:6px 0;color:#5A4E6E">Order #</td><td style="padding:6px 0;text-align:right;font-weight:700">${orderNumber}</td></tr>` : ""}
            ${bookTitle ? `<tr><td style="padding:6px 0;color:#5A4E6E">Book</td><td style="padding:6px 0;text-align:right;font-weight:700">${bookTitle}</td></tr>` : ""}
            ${childName ? `<tr><td style="padding:6px 0;color:#5A4E6E">For</td><td style="padding:6px 0;text-align:right;font-weight:700">${childName}</td></tr>` : ""}
            ${format ? `<tr><td style="padding:6px 0;color:#5A4E6E">Format</td><td style="padding:6px 0;text-align:right;font-weight:700">${format}</td></tr>` : ""}
            <tr><td style="padding:6px 0;color:#5A4E6E">Total</td><td style="padding:6px 0;text-align:right;font-weight:900;color:#E0654E">${amount}</td></tr>
          </table>
        </div>
        <p style="color:#5A4E6E;margin:0 0 24px">We'll let you know as soon as your book is ready. You can view your order details${format && format !== "pdf" ? ", including the shipping address," : ""} anytime.</p>
        <a href="${APP_URL()}/orders/${bookId}" style="display:inline-block;background:#E0654E;color:#fff;padding:14px 28px;border-radius:999px;font-weight:700;text-decoration:none">View your order →</a>
        <p style="color:#9B92B3;font-size:.8rem;margin-top:28px">Once Uponly · Personalized storybooks for every child</p>
      </div>
    `,
  });
}
