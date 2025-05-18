import DietPlan, { IDietPlan } from "../models/dietPlan";
import { CreateDietPlanDTO, UpdateDietPlanDTO } from "../dtos/dietPlan.dto";

function calculatePercentage(
  plan: { foodIds: string[]; completions: string[] }[]
) {
  return plan.map((entry) => ({
    ...entry,
    percentageOfCompletions: entry.foodIds.length
      ? (entry.completions.length / entry.foodIds.length) * 100
      : 0,
  }));
}

export async function createDietPlan(
  data: CreateDietPlanDTO
): Promise<IDietPlan> {
  const enrichedPlan = calculatePercentage(data.plan);
  return await DietPlan.create({ ...data, plan: enrichedPlan });
}

export async function getAllDietPlans(): Promise<IDietPlan[]> {
  return await DietPlan.find()
    .populate("plan.foodIds")
    .populate("plan.completions");
}

export async function getDietPlanById(id: string): Promise<IDietPlan | null> {
  return await DietPlan.findById(id)
    .populate("plan.foodIds")
    .populate("plan.completions");
}

export async function updateDietPlan(
  id: string,
  data: UpdateDietPlanDTO
): Promise<IDietPlan | null> {
  return await DietPlan.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteDietPlan(id: string): Promise<IDietPlan | null> {
  return await DietPlan.findByIdAndDelete(id);
}
