import mongoose, { Schema, model, models } from "mongoose";

export interface IReview {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  rating: number;
  body: string;
  verified: boolean;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  body: { type: String, required: true, maxlength: 1000 },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

ReviewSchema.index({ userId: 1 }, { unique: true });

export default (models.Review as mongoose.Model<IReview>) || model<IReview>("Review", ReviewSchema);
