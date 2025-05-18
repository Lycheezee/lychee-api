import { Schema, model, Document, Types } from "mongoose";
import { Nutrition, nutritionSchema } from "./food";

interface PlanEntry {
  date: Date;
  foodIds: Types.ObjectId[];
  completions: Types.ObjectId[];
  percentageOfCompletions: number;
}

export interface IDietPlan extends Document {
  nutritionsPerDay: Nutrition;
  plan: PlanEntry[];
}

const planEntrySchema = new Schema<PlanEntry>({
  date: { type: Date, required: true },
  foodIds: [{ type: Schema.Types.ObjectId, ref: "Food", required: true }],
  completions: [{ type: Schema.Types.ObjectId, ref: "Food", default: [] }],
  percentageOfCompletions: { type: Number, default: 0 },
});

const dietPlanSchema = new Schema<IDietPlan>(
  {
    nutritionsPerDay: nutritionSchema,
    plan: [planEntrySchema],
  },
  { timestamps: true }
);

export default model<IDietPlan>("DietPlan", dietPlanSchema);
