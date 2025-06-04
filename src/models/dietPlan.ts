import { Document, Schema, Types, model } from "mongoose";
import { EMealStatus } from "../constants/meal.enum";
import { Nutrition, nutritionSchema } from "./food";

// Schema-level interface for Mongoose (using ObjectId)
interface MealTargetSchema {
  foodId: Types.ObjectId;
  status: EMealStatus;
}

// Schema-level interface for plan entries (using ObjectId)
interface PlanEntrySchema {
  date?: Date;
  meals: MealTargetSchema[];
  percentageOfCompletions: number;
}

// Schema-level interface for diet plan document (for Mongoose only)
export interface IDietPlan extends Document {
  nutritionsPerDay: Nutrition;
  plan: PlanEntrySchema[];
  createdAt?: Date;
  updatedAt?: Date;
}

const PlanEntrySchema = new Schema<PlanEntrySchema>({
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
    plan: [PlanEntrySchema],
  },
  { timestamps: true }
);

export default model<IDietPlan>("DietPlan", dietPlanSchema);
