import { ObjectId } from "mongodb";
import { Document, Schema, Types, model } from "mongoose";
import { EGender, ExerciseRate, MacroPreference } from "../constants/user.enum";

interface BodyInfo {
  weight: number;
  height: number;
  exerciseRate: ExerciseRate;
  macro_preference?: MacroPreference;
  bmi: number;
}

export interface IUser {
  _id: ObjectId;
  email: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  hashPassword: string;
  bodyInfo?: BodyInfo;
  gender?: EGender;
  dateOfBirth?: Date;
  dietPlan?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// Mongoose document type for internal use
export interface IUserDocument extends Document, Omit<IUser, "_id"> {}

const bodyInfoSchema = new Schema<BodyInfo>(
  {
    weight: { type: Number },
    height: { type: Number },
    macro_preference: {
      type: String,
      enum: Object.values(MacroPreference),
      default: MacroPreference.BALANCED,
    },
    exerciseRate: {
      type: String,
      enum: Object.values(ExerciseRate),
    },
    bmi: { type: Number },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    middleName: { type: String },
    gender: {
      type: String,
      enum: Object.values(EGender),
      default: EGender.PREFER_NOT_TO_SAY,
    },
    dateOfBirth: { type: Date },
    hashPassword: { type: String, required: true },
    bodyInfo: { type: bodyInfoSchema, default: {} },
    dietPlan: { type: Schema.Types.ObjectId, ref: "dietPlan" },
  },
  { timestamps: true }
);

export default model<IUser>("User", userSchema);
