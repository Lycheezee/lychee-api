export interface MealPlanRequestDTO {
  height?: number;
  weight?: number;
  gender?: string;
  exercise_rate?: string;
  dob?: string; // Format: YYYY-MM-DD
  macro_preference?: string;
}

export interface CustomMealPlanRequestDTO {
  height: number;
  weight: number;
  gender: string;
  exercise_rate: string;
  dob: string; // Format: YYYY-MM-DD
  macro_preference: string;
}

export interface MealPlanResponseDTO {
  success: boolean;
  data: any; // The actual meal plan data from AI service
  message: string;
}

export interface UserValidationResponseDTO {
  isReady: boolean;
  validation: {
    hasBodyInfo: boolean;
    hasGender: boolean;
    hasDateOfBirth: boolean;
    missingFields: string[];
  };
  message: string;
}
