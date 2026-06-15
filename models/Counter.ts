import mongoose, { Schema, model, models } from "mongoose";

// Simple atomic sequence counter (e.g. for human-readable order numbers).
export interface ICounter {
  _id: string; // counter name, e.g. "order"
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export default (models.Counter as mongoose.Model<ICounter>) ||
  model<ICounter>("Counter", CounterSchema);
