import Food, { IFood } from "../models/food";
import { CreateFoodDTO, UpdateFoodDTO } from "../dtos/food.dto";

export async function createFood(data: CreateFoodDTO): Promise<IFood> {
  return await Food.create(data);
}

export async function getFoodById(id: string): Promise<IFood | null> {
  return await Food.findById(id);
}

export async function getAllFoods(): Promise<IFood[]> {
  return await Food.find();
}

export async function updateFood(
  id: string,
  data: UpdateFoodDTO
): Promise<IFood | null> {
  return await Food.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteFood(id: string): Promise<IFood | null> {
  return await Food.findByIdAndDelete(id);
}
