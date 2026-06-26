import mongoose, { Schema, model, models } from "mongoose";

export interface IOrder {
  _id: mongoose.Types.ObjectId;
  orderNumber?: string;
  bookId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  format: string;
  amountCents: number;
  stripeSessionId: string;
  gelatoOrderId?: string;
  status: "pending" | "paid" | "printing" | "shipped" | "fulfilled" | "refunded" | "canceled";
  shippingAddress?: Record<string, unknown>;
  carrier?: string;
  trackingCode?: string;
  trackingUrl?: string;
  shippedAt?: Date;
  shipmentEmailSentAt?: Date; // set once the buyer's "shipped" email actually goes out
  deliveryEmailSentAt?: Date; // set once the buyer's "delivered" email actually goes out
  note?: string; // legacy single note (migrated into notes[] on read)
  notes?: { text: string; at: Date }[];
  createdAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  orderNumber: { type: String, index: true },
  bookId: { type: Schema.Types.ObjectId, ref: "Book" },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  format: String,
  amountCents: Number,
  stripeSessionId: String,
  gelatoOrderId: String,
  status: { type: String, default: "pending" }, // pending | paid | printing | shipped | fulfilled
  shippingAddress: Object,
  carrier: String,
  trackingCode: String,
  trackingUrl: String,
  shippedAt: Date,
  shipmentEmailSentAt: Date,
  deliveryEmailSentAt: Date,
  note: String,
  notes: [{ text: String, at: { type: Date, default: Date.now } }],
  createdAt: { type: Date, default: Date.now },
});

export default (models.Order as mongoose.Model<IOrder>) || model<IOrder>("Order", OrderSchema);
