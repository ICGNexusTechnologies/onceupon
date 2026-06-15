import Counter from "@/models/Counter";

/**
 * Atomically generate the next human-readable order number, e.g. "OU-100042".
 * Starts at OU-100001 so numbers look established. Used as both the customer-
 * facing order number and the Gelato `orderReferenceId`, so the same number
 * ties together the app, our records, and Gelato's dashboard.
 */
export async function nextOrderNumber(): Promise<string> {
  const counter = await Counter.findByIdAndUpdate(
    "order",
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return `OU-${100000 + counter.seq}`;
}
