import { ObjectId } from "mongodb";

import { EMealStatus } from "../constants/meal.enum";
import {
  CreateDietPlanDTO,
  DailyPlan,
  UpdateDietPlanDTO,
  UpdateMealStatusDTO,
} from "../dtos/dietPlan.dto";
import DietPlanModel from "../models/dietPlan";
import Food from "../models/food";
import User from "../models/user";
import { DietPlan } from "../types/user";
import CacheService from "./cacheService";

/**
 * Calculates the percentage of completion based on nutritional values
 * @param plan The diet plan entries array
 * @returns The plan with updated percentageOfCompletions values
 */
async function calculateNutritionPercentage(
  plan: DailyPlan[]
): Promise<DailyPlan[]> {
  const updatedPlan: DailyPlan[] = [];

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
      _id: { $in: foodIds.map((id) => new ObjectId(id)) },
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
    entry.percentageOfCompletions =
      count > 0 ? Math.round((percentageSum / count) * 100) / 100 : 0;

    updatedPlan.push(entry);
  }

  return updatedPlan;
}

export async function createDietPlan(
  data: CreateDietPlanDTO
): Promise<DietPlan> {
  const enrichedPlan = await calculateNutritionPercentage(data.plan);
  const created = await DietPlanModel.create({ ...data, plan: enrichedPlan });

  // Convert schema type to business type
  return {
    _id: created._id.toString(),
    nutritionsPerDay: created.nutritionsPerDay,
    plan: enrichedPlan,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  };
}

export async function getAllDietPlans(): Promise<DietPlan[]> {
  const dietPlans = await DietPlanModel.find().populate({
    path: "plan.meals.foodId",
    model: "Food",
  });

  const businessDietPlans: DietPlan[] = [];

  // Recalculate percentages for each plan and convert to business type
  for (const dietPlan of dietPlans) {
    // Convert schema plan to business plan for calculations
    const businessPlan: DailyPlan[] = dietPlan.plan.map((entry: any) => ({
      date: entry.date,
      meals: entry.meals.map((meal: any) => ({
        foodId: meal.foodId.toString(),
        status: meal.status,
      })),
      percentageOfCompletions: entry.percentageOfCompletions,
    }));

    const updatedPlan = await calculateNutritionPercentage(businessPlan);

    // Convert back to schema format and save
    const schemaFormattedPlan = updatedPlan.map((entry) => ({
      ...entry,
      meals: entry.meals.map((meal) => ({
        ...meal,
        foodId: new ObjectId(meal.foodId),
      })),
    }));
    dietPlan.plan = schemaFormattedPlan as any;
    await dietPlan.save();

    // Create business result for this diet plan
    const businessResult = {
      _id: dietPlan._id.toString(),
      nutritionsPerDay: dietPlan.nutritionsPerDay,
      plan: updatedPlan,
      createdAt: dietPlan.createdAt,
      updatedAt: dietPlan.updatedAt,
    };

    // Update user caches for users who have this diet plan
    await updateUserCachesForDietPlan(dietPlan._id.toString(), businessResult);

    // Add to business result
    businessDietPlans.push(businessResult);
  }

  return businessDietPlans;
}

export async function getDietPlanById(id: string): Promise<DietPlan | null> {
  const dietPlan = await DietPlanModel.findById(id).populate({
    path: "plan.meals.foodId",
    model: "Food",
  });

  if (!dietPlan) {
    return null;
  }

  // Convert schema plan to business plan for calculations
  const businessPlan: DailyPlan[] = dietPlan.plan.map((entry: any) => ({
    date: entry.date,
    meals: entry.meals.map((meal: any) => ({
      foodId: meal.foodId.toString(),
      status: meal.status,
    })),
    percentageOfCompletions: entry.percentageOfCompletions,
  }));

  // Recalculate percentages
  const updatedPlan = await calculateNutritionPercentage(businessPlan);

  // Convert back to schema format and save
  const schemaFormattedPlan = updatedPlan.map((entry) => ({
    ...entry,
    meals: entry.meals.map((meal) => ({
      ...meal,
      foodId: new ObjectId(meal.foodId),
    })),
  }));
  dietPlan.plan = schemaFormattedPlan as any;
  await dietPlan.save();

  // Create business type result
  const businessResult = {
    _id: dietPlan._id.toString(),
    nutritionsPerDay: dietPlan.nutritionsPerDay,
    plan: updatedPlan,
    createdAt: dietPlan.createdAt,
    updatedAt: dietPlan.updatedAt,
  };

  // Update user caches for users who have this diet plan
  await updateUserCachesForDietPlan(id, businessResult);

  // Return business type
  return businessResult;
}

export async function updateDietPlan(
  id: string,
  data: UpdateDietPlanDTO
): Promise<DietPlan | null> {
  // If plan is being updated, recalculate percentages
  let enrichedPlan: DailyPlan[] | undefined;
  if (data.plan) {
    enrichedPlan = await calculateNutritionPercentage(data.plan);

    // Convert to schema format for database update
    const schemaFormattedPlan = enrichedPlan.map((entry) => ({
      ...entry,
      meals: entry.meals.map((meal) => ({
        ...meal,
        foodId: new ObjectId(meal.foodId),
      })),
    }));

    data = { ...data, plan: schemaFormattedPlan as any };
  }

  const updatedPlan = await DietPlanModel.findByIdAndUpdate(id, data, {
    new: true,
  });

  if (!updatedPlan) {
    return null;
  }

  // Get the full plan with populated food data
  const populatedPlan = await DietPlanModel.findById(id).populate({
    path: "plan.meals.foodId",
    model: "Food",
  });

  if (!populatedPlan) {
    return null;
  }

  // Convert to business plan and recalculate percentages
  const businessPlan: DailyPlan[] = populatedPlan.plan.map((entry: any) => ({
    date: entry.date,
    meals: entry.meals.map((meal: any) => ({
      foodId: meal.foodId._id.toString(),
      status: meal.status,
    })),
    percentageOfCompletions: entry.percentageOfCompletions,
  }));

  const finalUpdatedPlan = await calculateNutritionPercentage(businessPlan);

  // Save the updated percentages back to database
  const schemaFormattedPlan = finalUpdatedPlan.map((entry) => ({
    ...entry,
    meals: entry.meals.map((meal) => ({
      ...meal,
      foodId: new ObjectId(meal.foodId),
    })),
  }));
  populatedPlan.plan = schemaFormattedPlan as any;
  await populatedPlan.save();

  // Create business type result
  const businessResult = {
    _id: populatedPlan._id.toString(),
    nutritionsPerDay: populatedPlan.nutritionsPerDay,
    plan: finalUpdatedPlan,
    createdAt: populatedPlan.createdAt,
    updatedAt: populatedPlan.updatedAt,
  };

  // Update user caches for users who have this diet plan
  await updateUserCachesForDietPlan(id, businessResult);

  // Return business type
  return businessResult;
}

export async function deleteDietPlan(id: string): Promise<DietPlan | null> {
  const deletedPlan = await DietPlanModel.findByIdAndDelete(id);

  if (!deletedPlan) {
    return null;
  }

  // Remove diet plan reference from user caches
  try {
    const usersWithThisDietPlan = await User.find({
      dietPlan: new ObjectId(id),
    })
      .select("-hashPassword")
      .lean();

    // Update cache for each user to remove diet plan reference
    for (const user of usersWithThisDietPlan) {
      const cachedUser = CacheService.getUser(user._id.toString());

      if (cachedUser) {
        const updatedCachedUser = {
          ...cachedUser,
          dietPlan: undefined,
        };

        CacheService.setUser(user._id.toString(), updatedCachedUser);
      }
    }
  } catch (error) {
    console.error(
      "Error updating user caches after diet plan deletion:",
      error
    );
  }

  // Convert to business type for return
  const businessPlan: DailyPlan[] = deletedPlan.plan.map((entry: any) => ({
    date: entry.date,
    meals: entry.meals.map((meal: any) => ({
      foodId: meal.foodId.toString(),
      status: meal.status,
    })),
    percentageOfCompletions: entry.percentageOfCompletions,
  }));

  return {
    _id: deletedPlan._id.toString(),
    nutritionsPerDay: deletedPlan.nutritionsPerDay,
    plan: businessPlan,
    createdAt: deletedPlan.createdAt,
    updatedAt: deletedPlan.updatedAt,
  };
}

/**
 * Updates cached user data for all users who have the specified diet plan
 * @param dietPlanId The ID of the diet plan that was updated
 * @param updatedDietPlan The updated diet plan data
 */
async function updateUserCachesForDietPlan(
  dietPlanId: string,
  updatedDietPlan: DietPlan
): Promise<void> {
  try {
    // Find all users who have this diet plan
    const usersWithThisDietPlan = await User.find({
      dietPlan: new ObjectId(dietPlanId),
    })
      .select("-hashPassword")
      .lean();

    // Update cache for each user
    for (const user of usersWithThisDietPlan) {
      // Get current cached user data
      const cachedUser = CacheService.getUser(user._id.toString());

      if (cachedUser) {
        // Update the cached user's diet plan with the new data
        const updatedCachedUser = {
          ...cachedUser,
          dietPlan: updatedDietPlan,
        };

        // Update the cache
        CacheService.setUser(user._id.toString(), updatedCachedUser);
      }
    }
  } catch (error) {
    console.error("Error updating user caches for diet plan:", error);
    // Don't throw error as this is a cache update - the main operation should succeed
  }
}

/**
 * Updates the status of a specific meal in a diet plan
 * @param dietPlanId The ID of the diet plan
 * @param updateData Contains date, foodId, and new status
 * @returns Updated diet plan or null if not found
 */
export async function updateMealStatus(
  dietPlanId: string,
  updateData: UpdateMealStatusDTO
): Promise<DietPlan | null> {
  const { date, foodId, status } = updateData;

  // Convert date string to Date object for comparison
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // Find the diet plan
  const dietPlan = await DietPlanModel.findById(dietPlanId);

  if (!dietPlan) {
    return null;
  }

  // Find the specific day and meal to update
  let mealFound = false;

  for (const dayPlan of dietPlan.plan) {
    const dayDate = new Date(dayPlan.date!);
    dayDate.setHours(0, 0, 0, 0);

    if (dayDate.getTime() === targetDate.getTime()) {
      // Find the meal with the matching foodId
      for (const meal of dayPlan.meals) {
        if (meal.foodId.toString() === foodId) {
          meal.status = status;
          mealFound = true;
          break;
        }
      }
      break;
    }
  }

  if (!mealFound) {
    throw new Error(`Meal with foodId ${foodId} not found for date ${date}`);
  }

  // Convert to business plan format for percentage recalculation
  const businessPlan: DailyPlan[] = dietPlan.plan.map((entry: any) => ({
    date: entry.date,
    meals: entry.meals.map((meal: any) => ({
      foodId: meal.foodId._id
        ? meal.foodId._id.toString()
        : meal.foodId.toString(),
      status: meal.status,
    })),
    percentageOfCompletions: entry.percentageOfCompletions,
  }));

  // Recalculate percentages
  const updatedPlan = await calculateNutritionPercentage(businessPlan);

  // Convert back to schema format and save
  const schemaFormattedPlan = updatedPlan.map((entry) => ({
    ...entry,
    meals: entry.meals.map((meal) => ({
      ...meal,
      foodId: new ObjectId(meal.foodId),
    })),
  }));

  dietPlan.plan = schemaFormattedPlan as any;
  await dietPlan.save();

  // Create business type result
  const businessResult = {
    _id: dietPlan._id.toString(),
    nutritionsPerDay: dietPlan.nutritionsPerDay,
    plan: updatedPlan,
    createdAt: dietPlan.createdAt,
    updatedAt: dietPlan.updatedAt,
  };

  // Update user caches for users who have this diet plan
  await updateUserCachesForDietPlan(dietPlanId, businessResult);

  return businessResult;
}
