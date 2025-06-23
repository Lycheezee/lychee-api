import { EAiModel } from "../constants/model.enum";
import { DailyPlan } from "../dtos/dietPlan.dto";

export interface AiPlan {
  model: EAiModel;
  plan: DailyPlan[];
  createdAt: Date;
}

/**
 * Finds an AI plan by model from an array of AI plans
 * @param aiPlans Array of AI plans
 * @param model The AI model to find
 * @returns The AI plan for the specified model, or undefined if not found
 */
export function findAiPlanByModel(
  aiPlans: AiPlan[] | undefined,
  model: EAiModel
): AiPlan | undefined {
  return aiPlans?.find((aiPlan) => aiPlan.model === model);
}

/**
 * Gets the latest AI plan from an array of AI plans
 * @param aiPlans Array of AI plans
 * @returns The most recently created AI plan, or undefined if array is empty
 */
export function getLatestAiPlan(
  aiPlans: AiPlan[] | undefined
): AiPlan | undefined {
  if (!aiPlans || aiPlans.length === 0) return undefined;

  return aiPlans.reduce((latest, current) =>
    new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
  );
}

/**
 * Gets all AI models that have plans
 * @param aiPlans Array of AI plans
 * @returns Array of AI models that have plans
 */
export function getAvailableAiModels(
  aiPlans: AiPlan[] | undefined
): EAiModel[] {
  if (!aiPlans) return [];
  return aiPlans.map((aiPlan) => aiPlan.model);
}

/**
 * Adds or updates an AI plan in the array
 * @param aiPlans Existing array of AI plans
 * @param newAiPlan New AI plan to add or update
 * @returns Updated array of AI plans
 */
export function addOrUpdateAiPlan(
  aiPlans: AiPlan[] | undefined,
  newAiPlan: AiPlan
): AiPlan[] {
  const plans = aiPlans || [];
  const existingIndex = plans.findIndex(
    (aiPlan) => aiPlan.model === newAiPlan.model
  );

  if (existingIndex >= 0) {
    // Update existing AI plan
    const updatedPlans = [...plans];
    updatedPlans[existingIndex] = newAiPlan;
    return updatedPlans;
  } else {
    // Add new AI plan
    return [...plans, newAiPlan];
  }
}

/**
 * Removes an AI plan by model
 * @param aiPlans Existing array of AI plans
 * @param model The AI model to remove
 * @returns Updated array of AI plans without the specified model
 */
export function removeAiPlanByModel(
  aiPlans: AiPlan[] | undefined,
  model: EAiModel
): AiPlan[] {
  if (!aiPlans) return [];
  return aiPlans.filter((aiPlan) => aiPlan.model !== model);
}

/**
 * Gets AI plan statistics
 * @param aiPlans Array of AI plans
 * @returns Statistics about the AI plans
 */
export function getAiPlanStats(aiPlans: AiPlan[] | undefined): {
  totalPlans: number;
  models: EAiModel[];
  latestModel: EAiModel | undefined;
  oldestModel: EAiModel | undefined;
} {
  if (!aiPlans || aiPlans.length === 0) {
    return {
      totalPlans: 0,
      models: [],
      latestModel: undefined,
      oldestModel: undefined,
    };
  }

  const sortedByDate = [...aiPlans].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return {
    totalPlans: aiPlans.length,
    models: aiPlans.map((plan) => plan.model),
    latestModel: sortedByDate[sortedByDate.length - 1]?.model,
    oldestModel: sortedByDate[0]?.model,
  };
}
