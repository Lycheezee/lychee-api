import dotenv from "dotenv";
import {
  EGender,
  ExerciseRate,
  MacroPreference,
} from "../../constants/user.enum";
import { CreateDietPlanDTO, DailyPlan } from "../../dtos/dietPlan.dto";
import { IUser } from "../../models/user";
import { AuthUser } from "../../types/user";
import CurrentUser from "../../utils/currentUser";
import logger from "../../utils/logger";
import * as dietPlanService from "../dietPlanServices/dietPlanServices";

dotenv.config();

export interface MealRequest {
  height: number;
  weight: number;
  gender: string;
  exercise_rate: string;
  dob: string; // Format: YYYY-MM-DD
  macro_preference: string;
}

export interface MealPlanResponse {
  meal_plan?: any[];
  daily_targets?: any;
}

export interface SimilarMealPlansResponse {
  plans: DailyPlan[];
}

export class LycheeAIService {
  private static readonly AI_LYCHEE_API_URL =
    process.env.AI_LYCHEE_API_URL || "http://localhost:8888";

  /**
   * Generate a meal plan for the current user
   * @param userOverrides Optional overrides for user data
   * @returns Meal plan from AI service
   */
  static async generateMealPlan(
    userOverrides?: Partial<MealRequest>
  ): Promise<MealPlanResponse> {
    const currentUser = CurrentUser.get();
    if (!currentUser) {
      throw new Error("User must be authenticated to generate meal plan");
    }

    const mealRequest = this.buildMealRequest(currentUser, userOverrides);

    try {
      const response = await fetch(`${this.AI_LYCHEE_API_URL}/api/meal-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(mealRequest),
      });

      if (!response.ok) {
        throw new Error(
          `AI API request failed: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error calling meal plan API:", error);
      throw new Error("Failed to generate meal plan. Please try again later.");
    }
  }

  /**
   * Build meal request object from user data
   * @param user User data
   * @param overrides Optional overrides
   * @returns MealRequest object
   */
  private static buildMealRequest(
    user: IUser,
    overrides?: Partial<MealRequest>
  ): MealRequest {
    if (!user.bodyInfo && !overrides) {
      throw new Error("User must have body information to generate meal plan");
    }

    if (!user.gender) {
      throw new Error("User gender is required to generate meal plan");
    }

    if (!user.dateOfBirth) {
      throw new Error("User date of birth is required to generate meal plan");
    }

    // Convert exercise rate to the format expected by the API
    const exerciseRateMapping: Record<ExerciseRate, string> = {
      [ExerciseRate.Sedentary]: "sedentary",
      [ExerciseRate.Light]: "light",
      [ExerciseRate.Moderate]: "moderate",
      [ExerciseRate.Active]: "active",
      [ExerciseRate.VeryActive]: "very_active",
    };

    // Convert macro preference to the format expected by the API
    const macroPreferenceMapping: Record<MacroPreference, string> = {
      [MacroPreference.BALANCED]: "balanced",
      [MacroPreference.HIGH_PROTEIN]: "high_protein",
      [MacroPreference.LOW_CARB]: "low_carb",
      [MacroPreference.HIGH_CARB]: "high_carb",
      [MacroPreference.KETOGENIC]: "ketogenic",
    };

    // Convert gender to the format expected by the API
    const genderMapping: Record<EGender, string> = {
      [EGender.MALE]: "male",
      [EGender.FEMALE]: "female",
    };

    const defaultMacroPreference =
      user.bodyInfo?.macro_preference ||
      overrides?.macro_preference ||
      MacroPreference.BALANCED;

    const defaultExerciseRate =
      user.bodyInfo?.exerciseRate ||
      overrides?.exercise_rate ||
      ExerciseRate.Sedentary;

    const mealRequest: MealRequest = {
      height: user.bodyInfo?.height,
      weight: user.bodyInfo?.weight,
      gender: genderMapping[user.gender as EGender] || EGender.MALE,
      dob: this.formatDateOfBirth(user.dateOfBirth),
      ...overrides,
      // below include overrides
      exercise_rate: exerciseRateMapping[defaultExerciseRate] || "sedentary",
      macro_preference:
        macroPreferenceMapping[defaultMacroPreference] || "balanced",
    };

    return mealRequest;
  }

  /**
   * Format date of birth to YYYY-MM-DD format
   * @param dateOfBirth Date object or string
   * @returns Formatted date string
   */
  private static formatDateOfBirth(dateOfBirth: Date | string): string {
    const date = new Date(dateOfBirth);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date of birth");
    }
    return date.toISOString().split("T")[0];
  }

  /**
   * Generate and save meal plans for a specified duration
   * @param days Number of days to generate meal plans for
   * @param userOverrides Optional overrides for user data
   * @param nutritionsPerDay Default nutritional values per day
   */
  static async getSimilarMealPlans(
    days: number,
    user: AuthUser
  ): Promise<void> {
    if (!days || days <= 0 || days > 30) {
      throw new Error("Days must be a positive number between 1 and 30");
    }

    try {
      const startDate = new Date();

      // Generate meal plan for each day
      for (let i = 1; i < days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        console.log(
          `Generating meal plan for day ${i + 1} (${
            currentDate.toISOString().split("T")[0]
          })`
        );

        const mealPlan = await this.generateMealPlan();

        // Create daily plan with the current date
        const dailyPlan: DailyPlan = {
          date: currentDate,
          meals: mealPlan.meal_plan || [],
          percentageOfCompletions: 0,
        };

        const dietPlanData: CreateDietPlanDTO = {
          nutritionsPerDay: user.dietPlan.nutritionsPerDay,
          plan: [dailyPlan],
        };

        const savedPlan = await dietPlanService.updateDietPlan(
          user.dietPlan._id,
          dietPlanData
        );

        logger.info(
          `Saved meal plan for ${
            currentDate.toISOString().split("T")[0]
          } with ID: ${savedPlan._id}`
        );

        if (i < days - 1) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      logger.info(`Successfully generated and saved ${days} meal plans`);
    } catch (error) {
      logger.error("Error generating similar meal plans:", error);
      throw new Error(
        "Failed to generate similar meal plans. Please try again later."
      );
    }
  }
}

export default LycheeAIService;
