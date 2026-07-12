import mongoose, { Schema, model, models } from "mongoose";

/**
 * Idempotency ledger for inbound webhooks. Providers (Stripe especially) retry
 * deliveries, so each event is recorded here by its provider-issued ID before
 * processing; a duplicate-key error on insert means the event was already
 * handled and should be acknowledged without re-processing.
 */
export interface IWebhookEvent {
  _id: string; // provider event id, e.g. Stripe's "evt_..."
  source: string; // "stripe", "gelato", ...
  type?: string;
  status: "processing" | "processed";
  processedAt?: Date;
  createdAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>({
  _id: { type: String, required: true },
  source: { type: String, required: true },
  type: String,
  status: { type: String, required: true, default: "processing" },
  processedAt: Date,
  // TTL: no need to remember events forever — providers stop retrying within days.
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
});

export default (models.WebhookEvent as mongoose.Model<IWebhookEvent>) ||
  model<IWebhookEvent>("WebhookEvent", WebhookEventSchema);
