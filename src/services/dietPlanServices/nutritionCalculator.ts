import { EMealStatus } from "../../constants/meal.enum";
import { DailyPlan } from "../../dtos/dietPlan.dto";
import Food from "../../models/food";

/**
 * Calculates the percentage of completion based on nutritional values
 * @param plan The diet plan entries array
 * @returns The plan with updated percentageOfCompletions values
 */
export async function calculateNutritionPercentage(
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
    const foodIds = entry.meals.map(
      (meal) => (meal.foodId as any)._id ?? meal.foodId
    );

    // Get all foods with nutrition information
    const foods = await Food.find({
      _id: { $in: foodIds },
    });

    // Create a map of food IDs to nutrition data for easy lookup
    const foodMap = new Map();
    foods.forEach((food) => {
      foodMap.set(food._id.toString(), food.nutrition);
    });

    // Calculate total nutritional values for all meals
    const totalNutrition = {
      calories: 0,
      protein: 0,
      fat: 0,
      carbohydrates: 0,
      sugars: 0,
      fiber: 0,
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
        totalNutrition.protein += nutrition.protein || 0;
        totalNutrition.fat += nutrition.fat || 0;
        totalNutrition.carbohydrates += nutrition.carbohydrates || 0;
        totalNutrition.sugars += nutrition.sugars || 0;
        totalNutrition.fiber += nutrition.fiber || 0;
        totalNutrition.sodium += nutrition.sodium || 0;
        totalNutrition.cholesterol += nutrition.cholesterol || 0;
        totalNutrition.waterIntake += nutrition.waterIntake || 0;

        // Add to completed nutrition if the meal is completed
        if (meal.status === EMealStatus.COMPLETED) {
          completedNutrition.calories += nutrition.calories || 0;
          completedNutrition.protein += nutrition.protein || 0;
          completedNutrition.fat += nutrition.fat || 0;
          completedNutrition.carbohydrates += nutrition.carbohydrates || 0;
          completedNutrition.sugars += nutrition.sugars || 0;
          completedNutrition.fiber += nutrition.fiber || 0;
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
