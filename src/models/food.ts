import { Document, Schema, model } from "mongoose";

export interface Nutrition {
  fats: number;
  calories: number;
  sugars: number;
  proteins: number;
  fibers: number;
  sodium: number;
  cholesterol: number;
  carbohydrates: number;
}

export interface IFood extends Document {
  name: string;
  descriptions: string;
  images: string[];
  nutritions: Nutrition;
}

export const nutritionSchema = new Schema<Nutrition>(
  {
    fats: { type: Number, required: true },
    calories: { type: Number, required: true },
    sugars: { type: Number, required: true },
    proteins: { type: Number, required: true },
    fibers: { type: Number, required: true },
    sodium: { type: Number, required: true },
    cholesterol: { type: Number, required: true },
    carbohydrates: { type: Number, required: true },
  },
  { _id: false }
);

const foodSchema = new Schema<IFood>(
  {
    name: { type: String, required: true },
    descriptions: { type: String, required: true },
    images: [{ type: String }],
    nutritions: { type: nutritionSchema, required: true },
  },
  { timestamps: true }
);

export default model<IFood>("Food", foodSchema);
