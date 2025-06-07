import { EMealStatus } from "../constants/meal.enum";
import { Nutrition } from "../models/food";

export interface MealItem {
  foodId: string;
  status: EMealStatus;
}

export interface DailyPlan {
  date?: Date;
  meals: MealItem[];
  percentageOfCompletions?: number; // Optional, can be calculated later
}

export interface CreateDietPlanDTO {
  nutritionsPerDay: Partial<Nutrition>;
  plan: DailyPlan[];
}

export interface UpdateDietPlanDTO extends Partial<CreateDietPlanDTO> {}

export interface UpdateMealStatusDTO {
  date: string; // Date in YYYY-MM-DD format
  foodId: string;
  status: EMealStatus;
}
