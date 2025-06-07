// Main orchestrator for diet plan services
// Re-exports all diet plan functionality from modular services

// Diet Plan CRUD Operations
export {
  createDietPlan,
  deleteDietPlan,
  getAllDietPlans,
  getDietPlanById,
  getDietPlanByIdWithMeals,
  updateDietPlan,
} from "./dietPlanOperations";

// Meal Status Management
export { updateMealStatus } from "./mealStatusManager";

// Nutrition Calculation Utilities
export { calculateNutritionPercentage } from "./nutritionCalculator";

// Cache Management
export {
  removeDeletedDietPlanFromUserCaches,
  updateUserCachesForDietPlan,
} from "./dietPlanCacheManager";
