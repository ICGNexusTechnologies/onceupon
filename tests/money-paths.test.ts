import { describe, expect, it } from "vitest";
import { PRICES } from "../lib/stripe";
import {
  GIFT_CARD_RESERVATION_MS,
  giftCardCoversPurchase,
  giftCardRemainder,
  giftCardReservationExpiresAt,
} from "../lib/giftCardRedemption";

describe("gift card redemption math", () => {
  it("treats equal or larger gift cards as full redemptions", () => {
    expect(giftCardCoversPurchase(1900, 1900)).toBe(true);
    expect(giftCardCoversPurchase(1900, 2500)).toBe(true);
    expect(giftCardRemainder(1900, 2500)).toBe(-600);
  });

  it("returns the Stripe checkout remainder for partial redemptions", () => {
    expect(giftCardCoversPurchase(5400, 1500)).toBe(false);
    expect(giftCardRemainder(5400, 1500)).toBe(3900);
  });

  it("uses a one-hour reservation window for partial checkout races", () => {
    const now = new Date("2026-07-10T12:00:00.000Z");
    expect(giftCardReservationExpiresAt(now).getTime() - now.getTime()).toBe(GIFT_CARD_RESERVATION_MS);
  });
});

describe("configured checkout prices", () => {
  it("keeps expected product formats available", () => {
    expect(Object.keys(PRICES).sort()).toEqual(["hardcover", "pdf", "softcover"]);
  });

  it("marks only printed products as physical", () => {
    expect(PRICES.pdf.physical).toBe(false);
    expect(PRICES.softcover.physical).toBe(true);
    expect(PRICES.hardcover.physical).toBe(true);
  });
});
