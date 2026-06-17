import mongoose, { Schema, model, models } from "mongoose";

/** Tiny key/value store for runtime-toggleable settings (e.g. Gelato order mode). */
export interface ISettings {
  _id: string; // setting key
  value: string;
}

const SettingsSchema = new Schema<ISettings>({
  _id: { type: String, required: true },
  value: { type: String, required: true },
});

export default (models.Settings as mongoose.Model<ISettings>) ||
  model<ISettings>("Settings", SettingsSchema);
