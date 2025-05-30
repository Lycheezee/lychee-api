import {
  EGender,
  ExerciseRate,
  MacroPreference,
} from "../../constants/user.enum";
import { IUser } from "../../models/user";
import CurrentUser from "../../utils/currentUser";

export interface MealRequest {
  height: number;
  weight: number;
  gender: string;
  exercise_rate: string;
  dob: string; // Format: YYYY-MM-DD
  macro_preference: string;
}

export interface MealPlanResponse {
  // Define the structure based on what your API returns
  [key: string]: any;
}

export class LycheeAIService {
  private static readonly API_BASE_URL =
    process.env.AI_LYCHEE_API_URL || "http://localhost:3000";

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
      const response = await fetch(`${this.API_BASE_URL}/api/meal-plan`, {
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
   * Generate a meal plan for a specific user
   * @param user User data
   * @param overrides Optional overrides for user data
   * @returns Meal plan from AI service
   */
  static async generateMealPlanForUser(
    user: IUser,
    overrides?: Partial<MealRequest>
  ): Promise<MealPlanResponse> {
    const mealRequest = this.buildMealRequest(user, overrides);

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/meal-plan`, {
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
    if (!user.bodyInfo) {
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
      [EGender.OTHER]: "other",
      [EGender.PREFER_NOT_TO_SAY]: "prefer_not_to_say",
    };

    const defaultMacroPreference =
      user.bodyInfo.macro_preference || MacroPreference.BALANCED;

    const mealRequest: MealRequest = {
      height: user.bodyInfo.height,
      weight: user.bodyInfo.weight,
      gender: genderMapping[user.gender as EGender] || "other",
      exercise_rate:
        exerciseRateMapping[user.bodyInfo.exerciseRate] || "sedentary",
      dob: this.formatDateOfBirth(user.dateOfBirth),
      macro_preference:
        macroPreferenceMapping[defaultMacroPreference] || "balanced",
      ...overrides, // Apply any overrides
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
   * Validate meal request data
   * @param request Meal request object
   * @returns True if valid, throws error if invalid
   */
  static validateMealRequest(request: MealRequest): boolean {
    if (!request.height || request.height <= 0) {
      throw new Error("Valid height is required");
    }

    if (!request.weight || request.weight <= 0) {
      throw new Error("Valid weight is required");
    }

    if (
      !request.gender ||
      !["male", "female", "other", "prefer_not_to_say"].includes(request.gender)
    ) {
      throw new Error("Valid gender is required");
    }

    if (
      !request.exercise_rate ||
      !["sedentary", "light", "moderate", "active", "very_active"].includes(
        request.exercise_rate
      )
    ) {
      throw new Error("Valid exercise rate is required");
    }

    if (!request.dob || !/^\d{4}-\d{2}-\d{2}$/.test(request.dob)) {
      throw new Error("Date of birth must be in YYYY-MM-DD format");
    }

    if (
      !request.macro_preference ||
      ![
        "balanced",
        "high_protein",
        "low_carb",
        "high_carb",
        "ketogenic",
      ].includes(request.macro_preference)
    ) {
      throw new Error("Valid macro preference is required");
    }

    return true;
  }
}

export default LycheeAIService;
