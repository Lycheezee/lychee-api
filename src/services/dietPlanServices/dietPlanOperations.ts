import { ObjectId } from "mongodb";
import {
  CreateDietPlanDTO,
  DailyPlan,
  UpdateDietPlanDTO,
} from "../../dtos/dietPlan.dto";
import DietPlanModel from "../../models/dietPlan";
import { DietPlan } from "../../types/user";
import {
  removeDeletedDietPlanFromUserCaches,
  updateUserCachesForDietPlan,
} from "./dietPlanCacheManager";
import { calculateNutritionPercentage } from "./nutritionCalculator";

/**
 * Creates a new diet plan with calculated nutrition percentages
 */
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

/**
 * Gets all diet plans with updated nutrition percentages
 */
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

/**
 * Gets a diet plan by ID with updated nutrition percentages
 */
export async function getDietPlanById(id: string): Promise<DietPlan | null> {
  const dietPlan = await DietPlanModel.findById(id).populate({
    path: "plan.meals.foodId",
    model: "Food",
  });

  if (!dietPlan) return null;

  const businessPlan: DailyPlan[] = dietPlan.plan.map((entry: any) => ({
    date: entry.date,
    meals: entry.meals.map((meal: any) => ({
      ...meal.foodId.toObject(),
      foodId: meal.foodId._id.toString(),
      status: meal.status,
    })),
    percentageOfCompletions: entry.percentageOfCompletions,
  }));

  const updatedPlan = await calculateNutritionPercentage(businessPlan);
  const businessResult = {
    _id: dietPlan._id.toString(),
    nutritionsPerDay: dietPlan.nutritionsPerDay,
    plan: updatedPlan,
    createdAt: dietPlan.createdAt,
    updatedAt: dietPlan.updatedAt,
  };

  await updateUserCachesForDietPlan(id, businessResult);

  return businessResult;
}

/**
 * Updates a diet plan with new data and recalculates nutrition percentages
 */
export async function updateDietPlan(
  id: string,
  data: UpdateDietPlanDTO
): Promise<DietPlan | null> {
  let enrichedPlan: DailyPlan[] | undefined;
  if (data.plan) {
    enrichedPlan = await calculateNutritionPercentage(data.plan);
    const schemaFormattedPlan = enrichedPlan.map((entry) => ({
      ...entry,
      meals: entry.meals.map((meal) => ({
        ...meal,
        foodId: new ObjectId(meal.foodId),
      })),
    }));

    data = { ...data, plan: schemaFormattedPlan as any };
  }

  await DietPlanModel.findByIdAndUpdate(id, data, {
    new: true,
  });

  const newUpdatedPlan = await getDietPlanById(id);
  await updateUserCachesForDietPlan(id, newUpdatedPlan);
  return newUpdatedPlan;
}

/**
 * Deletes a diet plan and removes references from user caches
 */
export async function deleteDietPlan(id: string): Promise<DietPlan | null> {
  const deletedPlan = await DietPlanModel.findByIdAndDelete(id);

  if (!deletedPlan) {
    return null;
  }

  // Remove diet plan reference from user caches
  await removeDeletedDietPlanFromUserCaches(id);

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
