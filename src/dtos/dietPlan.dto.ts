import { Nutrition } from "../models/food";

export interface DailyPlan {
  date: string;
  foodIds: string[];
  completions: string[];
}

export interface CreateDietPlanDTO {
  nutritionsPerDay: Partial<Nutrition>;
  plan: DailyPlan[];
}

export interface UpdateDietPlanDTO extends Partial<CreateDietPlanDTO> {}
