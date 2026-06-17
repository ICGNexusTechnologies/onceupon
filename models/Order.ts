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
  status: "pending" | "paid" | "printing" | "shipped" | "fulfilled" | "refunded";
  shippingAddress?: Record<string, unknown>;
  carrier?: string;
  trackingCode?: string;
  trackingUrl?: string;
  shippedAt?: Date;
  note?: string;
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
  note: String,
  createdAt: { type: Date, default: Date.now },
});

export default (models.Order as mongoose.Model<IOrder>) || model<IOrder>("Order", OrderSchema);
