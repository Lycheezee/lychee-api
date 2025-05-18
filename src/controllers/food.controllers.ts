import { Request, Response } from "express";
import * as foodService from "../services/foodServices";
import catchAsync from "../utils/catchAsync";
import { CreateFoodDTO } from "../dtos/food.dto";
import { MulterRequest } from "../types/multer";

export const createFood = catchAsync(
  async (req: MulterRequest, res: Response) => {
    const images = req.files?.map((file) => file.path) || [];

    const foodData: CreateFoodDTO = {
      ...req.body,
      images,
      nutritions: {
        fats: Number(req.body.nutritions?.fats),
        calories: Number(req.body.nutritions?.calories),
        sugars: Number(req.body.nutritions?.sugars),
        proteins: Number(req.body.nutritions?.proteins),
        fibers: Number(req.body.nutritions?.fibers),
        sodium: Number(req.body.nutritions?.sodium),
        cholesterol: Number(req.body.nutritions?.cholesterol),
        waterIntake: Number(req.body.nutritions?.waterIntake),
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
