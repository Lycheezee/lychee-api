import { EGender, ExerciseRate, MacroPreference } from "../constants/user.enum";

export interface CreateUserDTO {
  email: string;
  password: string;
}

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  gender?: EGender;
  dateOfBirth?: string | Date;
  bodyInfo?: {
    weight?: number;
    height?: number;
    exerciseRate?: ExerciseRate;
    macro_preference?: MacroPreference;
  };
  dietPlan?: string;
  password?: string;
  mealPlanDays?: number;
}
