import { Document, Schema, Types, model } from "mongoose";
import { EMealStatus } from "../constants/meal.enum";
import { Nutrition, nutritionSchema } from "./food";

interface MealTarget {
  foodId: Types.ObjectId;
  status: EMealStatus;
}

interface PlanEntry {
  date: Date;
  meals: MealTarget[];
  percentageOfCompletions: number;
}

export interface IDietPlan extends Document {
  nutritionsPerDay: Nutrition;
  plan: PlanEntry[];
}

const planEntrySchema = new Schema<PlanEntry>({
  date: { type: Date, required: true },
  percentageOfCompletions: { type: Number, default: 0 },
  meals: [
    {
      foodId: { type: Schema.Types.ObjectId, ref: "Food", required: true },
      status: {
        type: String,
        enum: Object.values(EMealStatus),
        default: EMealStatus.NOT_COMPLETED,
      },
    },
  ],
});

const dietPlanSchema = new Schema<IDietPlan>(
  {
    nutritionsPerDay: nutritionSchema,
    plan: [planEntrySchema],
  },
  { timestamps: true }
);

export default model<IDietPlan>("DietPlan", dietPlanSchema);
