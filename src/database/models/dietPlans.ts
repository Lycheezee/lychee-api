import { Schema, model } from "mongoose";
import { DbSchema } from "../../types/dbSchema";

const types = Schema.Types;

const dietPlan = new Schema(
  {
    userId: {
      type: types.ObjectId,
      ref: "users",
      required: true,
    },
    targetWeight: {
      type: types.Number,
      required: true,
    },
    targetDate: {
      type: types.Date,
      required: true,
    },
    caloPerDay: {
      type: types.Number,
      required: true,
    },
    plan: [
      {
        date: types.Date,
        foodIds: [{ type: types.ObjectId, ref: "foods" }],
        completions: [{ type: types.ObjectId, ref: "foods" }],
        percentageOfCompletions: {
          type: types.Number,
          default: 0,
        },
      },
    ],
  },
  { collection: "dietPlans", timestamps: true }
);

const DietPlanModel = model("dietPlans", dietPlan);

export type DietPlanSchema = DbSchema<typeof DietPlanModel.schema>;
export default DietPlanModel;
