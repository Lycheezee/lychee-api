import { EMealStatus } from "../constants/meal.enum";
import { Nutrition } from "../models/food";

export interface MealItem {
  foodId: string;
  status: EMealStatus;
}

export interface DailyPlan {
  date: string;
  meals: MealItem[];
}

export interface CreateDietPlanDTO {
  nutritionsPerDay: Partial<Nutrition>;
  plan: DailyPlan[];
}

export interface UpdateDietPlanDTO extends Partial<CreateDietPlanDTO> {}
