import mongoose, { Schema, model, models } from "mongoose";

export interface IGiftCard {
  _id: mongoose.Types.ObjectId;
  code: string;
  amountCents: number;
  status: "pending" | "active" | "reserved" | "redeemed";
  purchaserEmail: string;
  recipientEmail: string;
  recipientName: string;
  message: string;
  redeemedByUserId?: mongoose.Types.ObjectId;
  redeemedBookId?: mongoose.Types.ObjectId;
  redeemedAt?: Date;
  redemptionStripeSessionId?: string;
  redemptionExpiresAt?: Date;
  stripeSessionId?: string;
  createdAt: Date;
}

const GiftCardSchema = new Schema<IGiftCard>({
  code: { type: String, required: true, unique: true },
  amountCents: { type: Number, required: true },
  status: { type: String, default: "pending" },
  purchaserEmail: String,
  recipientEmail: { type: String, required: true },
  recipientName: { type: String, required: true },
  message: { type: String, default: "" },
  redeemedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
  redeemedBookId: { type: Schema.Types.ObjectId, ref: "Book" },
  redeemedAt: Date,
  redemptionStripeSessionId: String,
  redemptionExpiresAt: Date,
  stripeSessionId: String,
  createdAt: { type: Date, default: Date.now },
});

export default (models.GiftCard as mongoose.Model<IGiftCard>) || model<IGiftCard>("GiftCard", GiftCardSchema);
