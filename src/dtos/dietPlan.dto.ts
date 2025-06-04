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
