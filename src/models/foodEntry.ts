import { Document, Schema, model } from "mongoose";

export interface INutritionData {
  calories: number; // kcal
  protein: number; // g
  carbohydrates: number; // g
  fat: number; // g
  fiber: number; // g
  sugars: number; // g
  sodium: number; // mg
  cholesterol: number; // mg
}

export interface IFoodEntry extends Document {
  date?: Date;
  name: string;
  nutrition: INutritionData;
}

const nutritionDataSchema = new Schema<INutritionData>(
  {
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbohydrates: { type: Number, required: true },
    fat: { type: Number, required: true },
    fiber: { type: Number, required: true },
    sugars: { type: Number, required: true },
    sodium: { type: Number, required: true },
    cholesterol: { type: Number, required: true },
  },
  { _id: false }
);

const foodEntrySchema = new Schema<IFoodEntry>(
  {
    date: { type: Date, required: false },
    name: { type: String, required: true },
    nutrition: { type: nutritionDataSchema, required: true },
  },
  { timestamps: true }
);

// Create indexes for better query performance
// foodEntrySchema.index({ userId: 1, date: 1 }); // Removed since these fields are now optional
foodEntrySchema.index({ name: 1 });
foodEntrySchema.index({ category: 1 });
foodEntrySchema.index({ mealType: 1 });

export default model<IFoodEntry>("FoodEntry", foodEntrySchema, "foods");
