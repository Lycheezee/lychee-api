import { DailyPlan } from "../dtos/dietPlan.dto";
import { Nutrition } from "../models/food";
import { IUser } from "../models/user";

// Business logic representation of diet plan
export interface DietPlan {
  _id?: string;
  nutritionsPerDay: Nutrition;
  plan: DailyPlan[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type AuthUser = Omit<IUser, "hashPassword" | "dietPlan"> & {
  dietPlan?: DietPlan;
};
