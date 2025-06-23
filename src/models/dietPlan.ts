import { Document, Schema, Types, model } from "mongoose";
import { EMealStatus } from "../constants/meal.enum";
import { EAiModel } from "../constants/model.enum";
import { Nutrition, nutritionSchema } from "./food";

interface MealTargetSchema {
  foodId: Types.ObjectId;
  status: EMealStatus;
}

interface PlanEntrySchema {
  date?: Date;
  meals: MealTargetSchema[];
  percentageOfCompletions: number;
}

export interface IDietPlan extends Document {
  nutritionsPerDay: Nutrition;
  type: EAiModel;
  aiPlans: {
    model: EAiModel;
    plan: PlanEntrySchema[];
    createdAt: Date;
  }[];
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
    type: {
      type: String,
      enum: Object.values(EAiModel),
      required: true,
      default: EAiModel.LYCHEE,
    },
    aiPlans: [
      {
        model: { type: String, enum: Object.values(EAiModel), required: true },
        plan: [PlanEntrySchema],
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default model<IDietPlan>("DietPlan", dietPlanSchema);
