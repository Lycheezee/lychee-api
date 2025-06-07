import { Document, Schema, model } from "mongoose";

export interface Nutrition {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugars: number;
  sodium: number;
  cholesterol: number;
  waterIntake: number;
}

export interface IFood extends Document {
  name: string;
  descriptions: string;
  images: string[];
  nutrition: Nutrition;
}

export const nutritionSchema = new Schema<Nutrition>(
  {
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbohydrates: { type: Number, required: true },
    fat: { type: Number, required: true },
    fiber: { type: Number, required: true },
    sugars: { type: Number, required: true },
    sodium: { type: Number, required: true },
    cholesterol: { type: Number, required: true },
    waterIntake: { type: Number, required: true },
  },
  { _id: false }
);

const foodSchema = new Schema<IFood>(
  {
    name: { type: String, required: true },
    descriptions: { type: String, required: true },
    images: [{ type: String }],
    nutrition: { type: nutritionSchema, required: true },
  },
  { timestamps: true }
);

export default model<IFood>("Food", foodSchema);
