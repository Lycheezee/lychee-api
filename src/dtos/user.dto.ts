import { ExerciseRate } from "../constants/user.enum";

export interface CreateUserDTO {
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  hashPassword: string;
  bodyInfo: {
    weight: number;
    height: number;
    exerciseRate: ExerciseRate;
  };
  dietPlan: string; // DietPlan ID
}

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  bodyInfo?: {
    weight?: number;
    height?: number;
    exerciseRate?: ExerciseRate;
  };
  dietPlan?: string;
}
