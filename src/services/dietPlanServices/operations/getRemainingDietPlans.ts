import moment from "moment";
import { getDietPlanById } from "./getDietPlanById";

/**
 * Gets the number of remaining diet plan days
 */
export async function getRemainingDietPlans(
  planId: string,
  totalDays: number
): Promise<number> {
  const dietPlans = await getDietPlanById(planId);
  if (!dietPlans) return 0;

  const daysSinceCreation = moment().diff(moment(dietPlans.createdAt), "days");

  return totalDays - daysSinceCreation;
}
