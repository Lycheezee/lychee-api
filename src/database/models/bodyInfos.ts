import { Schema, model } from "mongoose";
import { DbSchema } from "../../types/dbSchema";

const types = Schema.Types;

const bodyInfo = new Schema(
  {
    userId: {
      type: types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
    },
    weight: {
      type: types.Number,
      required: true,
    },
    height: {
      type: types.Number,
      required: true,
    },
    dailyExercise: {
      type: types.Number,
      required: true,
      min: 0,
      max: 100,
    },
    bmi: {
      type: types.Number,
      default: function () {
        // Calculate BMI from weight (kg) and height (m)
        return this.weight / Math.pow(this.height / 100, 2);
      },
    },
  },
  { collection: "bodyInfo", timestamps: true }
);

const BodyInfoModel = model("bodyInfos", bodyInfo);

export type BodyInfoSchema = DbSchema<typeof BodyInfoModel.schema>;
export default BodyInfoModel;
