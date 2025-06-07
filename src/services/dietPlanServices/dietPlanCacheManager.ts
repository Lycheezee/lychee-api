import { ObjectId } from "mongodb";
import User from "../../models/user";
import { DietPlan } from "../../types/user";
import CacheService from "../cacheService";

/**
 * Updates cached user data for all users who have the specified diet plan
 * @param dietPlanId The ID of the diet plan that was updated
 * @param updatedDietPlan The updated diet plan data
 */
export async function updateUserCachesForDietPlan(
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
 * Removes diet plan reference from user caches when a diet plan is deleted
 * @param dietPlanId The ID of the deleted diet plan
 */
export async function removeDeletedDietPlanFromUserCaches(
  dietPlanId: string
): Promise<void> {
  try {
    const usersWithThisDietPlan = await User.find({
      dietPlan: new ObjectId(dietPlanId),
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
}
