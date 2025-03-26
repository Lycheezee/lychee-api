import { BMI } from "../types/bodyInfos.type";

export const calcBMI = ({ weight, height }: BMI) => {
  // Calculate BMI from weight (kg) and height (m)
  return weight / Math.pow(height / 100, 2);
};
