import mongoose from "mongoose";
import { EMealStatus } from "../constants/meal.enum";
import { CreateDietPlanDTO, UpdateDietPlanDTO } from "../dtos/dietPlan.dto";
import DietPlan, { IDietPlan } from "../models/dietPlan";
import Food from "../models/food";

/**
 * Calculates the percentage of completion based on nutritional values
 * @param plan The diet plan entries
 * @returns The plan with updated percentageOfCompletions values
 */
async function calculateNutritionPercentage(plan) {
  const updatedPlan = [];

  for (const entry of plan) {
    // Skip if no meals
    if (!entry.meals || entry.meals.length === 0) {
      entry.percentageOfCompletions = 0;
      updatedPlan.push(entry);
      continue;
    }

    // Get all food IDs from the meals
    const foodIds = entry.meals.map((meal) => meal.foodId);

    // Get all foods with nutrition information
    const foods = await Food.find({
      _id: { $in: foodIds.map((id) => new mongoose.Types.ObjectId(id)) },
    });

    // Create a map of food IDs to nutrition data for easy lookup
    const foodMap = new Map();
    foods.forEach((food) => {
      foodMap.set(food._id.toString(), food.nutritions);
    });

    // Calculate total nutritional values for all meals
    const totalNutrition = {
      calories: 0,
      proteins: 0,
      fats: 0,
      carbohydrates: 0,
      sugars: 0,
      fibers: 0,
      sodium: 0,
      cholesterol: 0,
      waterIntake: 0,
    };

    // Calculate nutritional values for completed meals
    const completedNutrition = { ...totalNutrition };

    // Sum up nutritional values
    for (const meal of entry.meals) {
      const foodId = meal.foodId.toString();
      const nutrition = foodMap.get(foodId);

      if (nutrition) {
        // Add to total nutrition
        totalNutrition.calories += nutrition.calories || 0;
        totalNutrition.proteins += nutrition.proteins || 0;
        totalNutrition.fats += nutrition.fats || 0;
        totalNutrition.carbohydrates += nutrition.carbohydrates || 0;
        totalNutrition.sugars += nutrition.sugars || 0;
        totalNutrition.fibers += nutrition.fibers || 0;
        totalNutrition.sodium += nutrition.sodium || 0;
        totalNutrition.cholesterol += nutrition.cholesterol || 0;
        totalNutrition.waterIntake += nutrition.waterIntake || 0;

        // Add to completed nutrition if the meal is completed
        if (meal.status === EMealStatus.COMPLETED) {
          completedNutrition.calories += nutrition.calories || 0;
          completedNutrition.proteins += nutrition.proteins || 0;
          completedNutrition.fats += nutrition.fats || 0;
          completedNutrition.carbohydrates += nutrition.carbohydrates || 0;
          completedNutrition.sugars += nutrition.sugars || 0;
          completedNutrition.fibers += nutrition.fibers || 0;
          completedNutrition.sodium += nutrition.sodium || 0;
          completedNutrition.cholesterol += nutrition.cholesterol || 0;
          completedNutrition.waterIntake += nutrition.waterIntake || 0;
        }
      }
    }

    // Calculate average percentage across all nutritional values
    let percentageSum = 0;
    let count = 0;

    for (const key in totalNutrition) {
      if (totalNutrition[key] > 0) {
        percentageSum += (completedNutrition[key] / totalNutrition[key]) * 100;
        count++;
      }
    }

    // Set the percentage of completion
    entry.percentageOfCompletions = count > 0 ? percentageSum / count : 0;

    updatedPlan.push(entry);
  }

  return updatedPlan;
}

export async function createDietPlan(
  data: CreateDietPlanDTO
): Promise<IDietPlan> {
  // Calculate percentages based on nutritional data
  const enrichedPlan = await calculateNutritionPercentage(data.plan);
  return await DietPlan.create({ ...data, plan: enrichedPlan });
}

export async function getAllDietPlans(): Promise<IDietPlan[]> {
  const dietPlans = await DietPlan.find().populate({
    path: "plan.meals.foodId",
    model: "Food",
  });

  // Recalculate percentages for each plan
  for (const dietPlan of dietPlans) {
    dietPlan.plan = await calculateNutritionPercentage(dietPlan.plan);
    await dietPlan.save();
  }

  return dietPlans;
}

export async function getDietPlanById(id: string): Promise<IDietPlan | null> {
  const dietPlan = await DietPlan.findById(id).populate({
    path: "plan.meals.foodId",
    model: "Food",
  });

  if (dietPlan) {
    // Recalculate percentages
    dietPlan.plan = await calculateNutritionPercentage(dietPlan.plan);
    await dietPlan.save();
  }

  return dietPlan;
}

export async function updateDietPlan(
  id: string,
  data: UpdateDietPlanDTO
): Promise<IDietPlan | null> {
  // If plan is being updated, recalculate percentages
  if (data.plan) {
    data.plan = await calculateNutritionPercentage(data.plan);
  }

  const updatedPlan = await DietPlan.findByIdAndUpdate(id, data, { new: true });

  if (updatedPlan) {
    // Get the full plan with populated food data
    const populatedPlan = await DietPlan.findById(id).populate({
      path: "plan.meals.foodId",
      model: "Food",
    });

    if (populatedPlan) {
      // Recalculate percentages for the whole plan
      populatedPlan.plan = await calculateNutritionPercentage(
        populatedPlan.plan
      );
      return await populatedPlan.save();
    }
  }

  return updatedPlan;
}

export async function deleteDietPlan(id: string): Promise<IDietPlan | null> {
  return await DietPlan.findByIdAndDelete(id);
}
