export const GIFT_CARD_RESERVATION_MS = 60 * 60 * 1000;

export function giftCardRemainder(priceAmountCents: number, giftAmountCents: number) {
  return priceAmountCents - giftAmountCents;
}

export function giftCardCoversPurchase(priceAmountCents: number, giftAmountCents: number) {
  return giftCardRemainder(priceAmountCents, giftAmountCents) <= 0;
}

export function giftCardReservationExpiresAt(now: Date) {
  return new Date(now.getTime() + GIFT_CARD_RESERVATION_MS);
}
