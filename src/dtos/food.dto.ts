import { Nutrition } from "../models/food";

export interface CreateFoodDTO {
  name: string;
  descriptions: string;
  images?: string[];
  nutrition: Partial<Nutrition>;
}

export interface UpdateFoodDTO extends Partial<CreateFoodDTO> {}
