import {
  BatchUpdateMealStatusDTO,
  UpdateMealStatusDTO,
} from "../../dtos/dietPlan.dto";
import { DietPlan } from "../../types/user";
import { getDietPlanById, updateDietPlan } from "./operations";

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
  return await updateMealStatusBatch(dietPlanId, { updates: [updateData] });
}

/**
 * Updates the status of multiple meals in a diet plan efficiently
 * @param dietPlanId The ID of the diet plan
 * @param batchUpdateData Contains array of meal status updates
 * @returns Updated diet plan or null if not found
 */
export async function updateMealStatusBatch(
  dietPlanId: string,
  batchUpdateData: BatchUpdateMealStatusDTO
): Promise<DietPlan | null> {
  const { updates } = batchUpdateData;

  if (!updates || updates.length === 0) {
    throw new Error("No meal status updates provided");
  }

  const dietPlan = await getDietPlanById(dietPlanId);
  if (!dietPlan) {
    return null;
  }

  const updatedMeals: string[] = [];
  const notFoundMeals: string[] = [];

  // Process all updates in a single pass through the diet plan
  for (const update of updates) {
    const { date, foodId, status } = update;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    let mealFound = false;

    for (const dayPlan of dietPlan.plan) {
      const dayDate = new Date(dayPlan.date!);
      dayDate.setHours(0, 0, 0, 0);

      if (dayDate.getTime() === targetDate.getTime()) {
        for (const meal of dayPlan.meals) {
          if (meal.foodId.toString() === foodId) {
            // Only update if status is different to avoid unnecessary changes
            if (meal.status !== status) {
              meal.status = status;
              updatedMeals.push(`${date}:${foodId}`);
            }
            mealFound = true;
            break;
          }
        }
        break;
      }
    }

    if (!mealFound) {
      notFoundMeals.push(`${date}:${foodId}`);
    }
  }

  // Report any meals that weren't found
  if (notFoundMeals.length > 0) {
    throw new Error(`Meals not found: ${notFoundMeals.join(", ")}`);
  }

  // Only call updateDietPlan once with all changes if any updates were made
  if (updatedMeals.length > 0) {
    const updatedPlan = await updateDietPlan(dietPlanId, {
      plan: dietPlan.plan,
    });
    return updatedPlan;
  }

  // Return the current plan if no changes were needed
  return dietPlan;
}
