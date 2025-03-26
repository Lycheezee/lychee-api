import { Schema, model } from "mongoose";
import { DbSchema } from "../../types/dbSchema";

const types = Schema.Types;

const food = new Schema(
  {
    name: {
      type: types.String,
      required: true,
    },
    description: {
      type: types.String,
    },
    images: [types.String],
    nutrition: {
      fats: types.Number,
      calories: types.Number,
      sugars: types.Number,
      proteins: types.Number,
      fibers: types.Number,
      sodium: types.Number,
      cholesterol: types.Number,
      waterIntake: types.Number,
    },
  },
  { collection: "foods", timestamps: true }
);

const FoodModel = model("foods", food);

export type FoodSchema = DbSchema<typeof FoodModel.schema>;
export default FoodModel;
