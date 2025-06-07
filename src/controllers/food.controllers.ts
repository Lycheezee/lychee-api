import { Request, Response } from "express";
import { CreateFoodDTO } from "../dtos/food.dto";
import * as foodService from "../services/foodServices";
import { MulterRequest } from "../types/multer";
import catchAsync from "../utils/catchAsync";
import CurrentUser from "../utils/currentUser";

export const createFood = catchAsync(
  async (req: MulterRequest, res: Response) => {
    // Example of accessing current user globally
    const currentUser = CurrentUser.get();
    const currentUserId = CurrentUser.getId();

    console.log(
      `Food being created by user: ${currentUser?.email} (ID: ${currentUserId})`
    );

    const images = req.files?.map((file) => file.path) || [];
    const foodData: CreateFoodDTO = {
      ...req.body,
      images,
      nutrition: {
        calories: Number(req.body.nutrition?.calories),
        protein: Number(req.body.nutrition?.protein),
        carbohydrates: Number(req.body.nutrition?.carbohydrates),
        fat: Number(req.body.nutrition?.fat),
        fiber: Number(req.body.nutrition?.fiber),
        sugars: Number(req.body.nutrition?.sugars),
        sodium: Number(req.body.nutrition?.sodium),
        cholesterol: Number(req.body.nutrition?.cholesterol),
        waterIntake: Number(req.body.nutrition?.waterIntake),
      },
    };

    const food = await foodService.createFood(foodData);
    res.status(201).json(food);
  }
);

export const getFood = catchAsync(async (req: Request, res: Response) => {
  const food = await foodService.getFoodById(req.params.id);
  if (!food) return res.status(404).json({ message: "Food not found" });
  res.json(food);
});

export const getAllFoods = catchAsync(async (_req: Request, res: Response) => {
  const foods = await foodService.getAllFoods();
  res.json(foods);
});

export const updateFood = catchAsync(async (req: Request, res: Response) => {
  const food = await foodService.updateFood(req.params.id, req.body);
  if (!food) return res.status(404).json({ message: "Food not found" });
  res.json(food);
});

export const deleteFood = catchAsync(async (req: Request, res: Response) => {
  const food = await foodService.deleteFood(req.params.id);
  if (!food) return res.status(404).json({ message: "Food not found" });
  res.json({ message: "Food deleted" });
});
