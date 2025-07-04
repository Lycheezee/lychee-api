import moment from "moment";
import { IFood, Nutrition } from "../../models/food";

export const AI_PROMPT = (
  foodList: IFood[],
  dayLast: number,
  dailyNutrition: Nutrition
) =>
  `You are a nutrition-focused AI tasked with generating a daily meal plan using a list of available foods.
Each food item has detailed nutritional information. Your goal is to choose foods that form a balanced daily plan.

Inputs:
FoodList: A JSON array of available foods, each having a unique id, name, and a nutrition object with the following fields:
calories, protein, carbohydrates, fat, fiber, sugars, sodium, cholesterol, waterIntake
FoodList = ${JSON.stringify(foodList)}

Output Requirements:
Return an array of PlanEntrySchema, where each entry includes:
date (optional): The date of the meal plan. (start from ${moment().toISOString()} and last for ${dayLast} days)
meals: An array of selected foods, each represented by:{
foodId: the ObjectId of the selected food from FoodList
status: a value from 'completed', 'not_completed'}
percentageOfCompletions: a number between 0 and 100 indicating how well the selected meals meet daily nutrition goals.

Guidelines:
No comments or explanations in the output.
Select multiple foods per day (from 4 to 8 meals) that together meet average daily nutritional needs for a person that has the following body info:
${JSON.stringify(dailyNutrition)}
Ensure macronutrient balance in each plan.
Use food variety from the input list and try not to repeat the same foods too often.
Use the actual _id from the food list for foodId in MealTargetSchema.
You must generate plans for multiple days (up to ${dayLast} days in the response).
Set status to 'not_completed' by default.
Set percentageOfCompletions to 0 initially.
Compute percentageOfCompletions based on how well the selected foods match the target nutrition goals.`;
