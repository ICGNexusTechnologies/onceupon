import mongoose, { Schema, model, models } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  resetTokenHash?: string;
  resetTokenExpires?: Date;
  mfaEnabled?: boolean;
  totpSecret?: string; // encrypted (AES-256-GCM)
  totpPending?: string; // encrypted, during setup before confirmation
  mfaBackupCodes?: string[]; // bcrypt hashes; consumed on use
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, unique: true, required: true },
  name: String,
  passwordHash: String,
  resetTokenHash: String,
  resetTokenExpires: Date,
  mfaEnabled: { type: Boolean, default: false },
  totpSecret: String,
  totpPending: String,
  mfaBackupCodes: [String],
  createdAt: { type: Date, default: Date.now },
});

export default (models.User as mongoose.Model<IUser>) || model<IUser>("User", UserSchema);
