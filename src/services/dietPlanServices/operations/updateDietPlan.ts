import moment from "moment";
import { ObjectId } from "mongodb";
import { DailyPlan, UpdateDietPlanDTO } from "../../../dtos/dietPlan.dto";
import DietPlanModel from "../../../models/dietPlan";
import { DietPlan } from "../../../types/user";
import { updateUserCachesForDietPlan } from "../dietPlanCacheManager";
import { calculateNutritionPercentage } from "../nutritionCalculator";
import { getDietPlanById } from "./getDietPlanById";

/**
 * Updates a diet plan with new data and recalculates nutrition percentages
 */
export async function updateDietPlan(
  id: string,
  data: UpdateDietPlanDTO
): Promise<DietPlan | null> {
  let enrichedPlan: DailyPlan[] | undefined;
  const existingPlan = await getDietPlanById(id);

  if (!existingPlan) return null;

  let mergedPlan: DailyPlan[] = [...existingPlan.plan];
  if (data.aiPlans && data.aiPlans.length > 0) {
    // Get the latest AI plan (assume it's the one being added)
    const latestAiPlan = data.aiPlans[data.aiPlans.length - 1];
    const today = moment().startOf("day").toDate();

    const pastPlans = existingPlan.plan.filter((existing) => {
      const existingDate = moment(existing.date!).startOf("day").toDate();
      return existingDate.getTime() < today.getTime();
    });

    mergedPlan = [...pastPlans, ...latestAiPlan.plan].sort(
      (a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime()
    );

    enrichedPlan = await calculateNutritionPercentage(mergedPlan);
    const schemaFormattedPlan = enrichedPlan.map((entry) => ({
      ...entry,
      meals: entry.meals.map((meal) => ({
        ...meal,
        foodId: new ObjectId(meal.foodId),
      })),
    }));

    // Merge existing aiPlans with new ones, ensuring no duplicates by model
    const existingAiPlans = existingPlan.aiPlans || [];
    const updatedAiPlans = [...existingAiPlans];

    // Add or update AI plans
    for (const newAiPlan of data.aiPlans) {
      const existingIndex = updatedAiPlans.findIndex(
        (existing) => existing.model === newAiPlan.model
      );
      const formattedAiPlan = {
        model: newAiPlan.model,
        plan: schemaFormattedPlan as any,
        createdAt: newAiPlan.createdAt || new Date(),
      };

      if (existingIndex >= 0) {
        // Update existing AI plan
        updatedAiPlans[existingIndex] = formattedAiPlan;
      } else {
        // Add new AI plan
        updatedAiPlans.push(formattedAiPlan);
      }
    }

    const updateDietPlan = {
      ...data,
      aiPlans: updatedAiPlans,
    };

    await DietPlanModel.findByIdAndUpdate(id, updateDietPlan, {
      new: true,
    });

    const newUpdatedPlan = await getDietPlanById(id);
    await updateUserCachesForDietPlan(id, newUpdatedPlan);
    return newUpdatedPlan;
  } else {
    if (data.plan) {
      for (const newDayPlan of data.plan) {
        const newDate = moment(newDayPlan.date!).startOf("day").toDate();

        const existingIndex = mergedPlan.findIndex((existingDayPlan) => {
          const existingDate = new Date(existingDayPlan.date!);
          existingDate.setHours(0, 0, 0, 0);
          return existingDate.getTime() === newDate.getTime();
        });

        if (existingIndex !== -1) {
          mergedPlan[existingIndex] = newDayPlan;
        } else {
          mergedPlan.push(newDayPlan);
        }
      }
    }
    mergedPlan.sort(
      (a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime()
    );

    enrichedPlan = await calculateNutritionPercentage(mergedPlan);
    const schemaFormattedPlan = enrichedPlan.map((entry) => ({
      ...entry,
      meals: entry.meals.map((meal) => ({
        ...meal,
        foodId: new ObjectId(meal.foodId),
      })),
    }));

    const updateDietPlan = { ...data, plan: schemaFormattedPlan as any };

    await DietPlanModel.findByIdAndUpdate(id, updateDietPlan, {
      new: true,
    });

    const newUpdatedPlan = await getDietPlanById(id);
    await updateUserCachesForDietPlan(id, newUpdatedPlan);
    return newUpdatedPlan;
  }
}
