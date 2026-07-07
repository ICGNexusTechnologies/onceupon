import mongoose, { Schema, model, models } from "mongoose";

export interface IPage {
  pageNumber: number;
  text: string;
  setting: string;
  time: string;
  imagePrompt: string;
  imageUrl?: string;
}

export interface IBook {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  dedication: string;
  child: {
    name: string;
    age: number;
    hairColor: string;
    skinTone: string;
    outfitColor: string;
  };
  loves: string;
  value: string;
  world: string;
  tone: string;
  storyDescription?: string;
  language: string;
  characterSheet: string;
  artStyle: string;
  synopsis?: string;
  status: "preview" | "paid" | "generating_art" | "complete" | "error";
  format?: string;
  coverUrl?: string;
  heroReferenceUrl?: string;
  pdfUrl?: string;
  pages: IPage[];
  createdAt: Date;
}

const PageSchema = new Schema<IPage>(
  {
    pageNumber: Number,
    text: String,
    setting: String,
    time: String,
    imagePrompt: String,
    imageUrl: String,
  },
  { _id: false }
);

const BookSchema = new Schema<IBook>({
  userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  title: String,
  dedication: String,
  child: {
    name: String,
    age: Number,
    hairColor: String,
    skinTone: String,
    outfitColor: String,
  },
  loves: String,
  value: String,
  world: String,
  tone: String,
  storyDescription: String,
  language: { type: String, default: "en" },
  characterSheet: String,
  artStyle: String,
  synopsis: String,
  status: { type: String, default: "preview" }, // preview | paid | generating_art | complete | error
  format: String,
  coverUrl: String,
  heroReferenceUrl: String,
  pdfUrl: String,
  pages: [PageSchema],
  createdAt: { type: Date, default: Date.now },
});

export default (models.Book as mongoose.Model<IBook>) || model<IBook>("Book", BookSchema);
