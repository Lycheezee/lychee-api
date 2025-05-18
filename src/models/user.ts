import { Schema, model, Document, Types } from "mongoose";
import { ExerciseRate } from "../constants/user.enum";

interface BodyInfo {
  weight: number;
  height: number;
  exerciseRate: ExerciseRate;
  bmi: number;
}

export interface IUser extends Document {
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  hashPassword: string;
  bodyInfo: BodyInfo;
  dietPlan: Types.ObjectId;
}

const bodyInfoSchema = new Schema<BodyInfo>(
  {
    weight: { type: Number, required: true },
    height: { type: Number, required: true },
    exerciseRate: {
      type: String,
      enum: Object.values(ExerciseRate),
      required: true,
    },
    bmi: { type: Number, required: true },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    middleName: { type: String },
    hashPassword: { type: String, required: true },
    bodyInfo: { type: bodyInfoSchema, required: true },
    dietPlan: { type: Schema.Types.ObjectId, ref: "dietPlan", required: true },
  },
  { timestamps: true }
);

export default model<IUser>("User", userSchema);
