import { EMealStatus } from "../constants/meal.enum";
import { EAiModel } from "../constants/model.enum";
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
  type?: EAiModel;
  aiPlans?: {
    model: EAiModel;
    plan: DailyPlan[];
    createdAt?: Date;
  }[];
}

export interface UpdateDietPlanDTO extends Partial<CreateDietPlanDTO> {}

export interface UpdateMealStatusDTO {
  date: string; // Date in YYYY-MM-DD format
  foodId: string;
  status: EMealStatus;
}

export interface BatchUpdateMealStatusDTO {
  updates: UpdateMealStatusDTO[];
}
