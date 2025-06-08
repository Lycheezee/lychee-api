import { UpdateMealStatusDTO } from "../../dtos/dietPlan.dto";
import { DietPlan } from "../../types/user";
import { getDietPlanById, updateDietPlan } from "./dietPlanOperations";

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

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const dietPlan = await getDietPlanById(dietPlanId);
  let mealFound = false;

  for (const dayPlan of dietPlan.plan) {
    const dayDate = new Date(dayPlan.date!);
    dayDate.setHours(0, 0, 0, 0);

    if (dayDate.getTime() === targetDate.getTime()) {
      for (const meal of dayPlan.meals) {
        if (meal.foodId.toString() === foodId && meal.status !== status) {
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

  const updatedPlan = await updateDietPlan(dietPlanId, {
    plan: dietPlan.plan,
  });

  return updatedPlan;
}
