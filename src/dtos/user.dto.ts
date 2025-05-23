import { ExerciseRate } from "../constants/user.enum";

export interface CreateUserDTO {
  email: string;
  password: string;
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
  password?: string;
}
