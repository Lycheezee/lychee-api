import { GoogleGenAI } from "@google/genai";
import { IFood, Nutrition } from "../../models/food";
import { IUser } from "../../models/user";
import logger from "../../utils/logger";
import { AI_PROMPT } from "../constants/aiPrompt";

// Define response types for better type safety
export interface GemmaResponse<T> {
  model: string;
  content: T;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface FlashResponse<T> {
  model: string;
  content: T;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Define specific model response types
export interface DietSuggestionResponse {
  suggestions: Array<{
    meal: string;
    foods: string[];
    nutritionInfo: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  }>;
  dailyNutritionSummary: {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  };
}

export interface FoodSubstitutionResponse {
  originalFood: string;
  substitutions: Array<{
    food: string;
    similarityScore: number;
    nutritionComparison: {
      calories: { original: number; substitute: number; difference: number };
      protein: { original: number; substitute: number; difference: number };
      carbs: { original: number; substitute: number; difference: number };
      fat: { original: number; substitute: number; difference: number };
    };
    reasonForSubstitution: string;
  }>;
}

export class OpenAIService {
  private client: GoogleGenAI;
  private user: IUser;
  private dailyNutrition: Nutrition;
  private foodList: IFood[] = [];
  private dateLast?: number;

  public constructor(
    user: IUser,
    foodList: IFood[],
    dateLast?: number,
    dailyNutrition?: Nutrition
  ) {
    const apiKey = process.env.OPEN_AI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }

    this.user = user;
    this.foodList = foodList;
    this.dateLast = dateLast;
    this.dailyNutrition = (user.dietPlan as any).nutritionsPerDay;
    this.client = new GoogleGenAI({
      apiKey: apiKey,
    });
  }
  public async getGemmaResponse(): Promise<string> {
    try {
      // Slice foodList to first 100 items for Gemma
      const slicedFoodList = this.foodList.slice(0, 100);
      const gemmaSystemPrompt = AI_PROMPT(
        slicedFoodList,
        this.dateLast,
        this.dailyNutrition
      );

      const res = await this.client.models.generateContent({
        model: "gemma-3-27b-it",
        contents: gemmaSystemPrompt,
      });

      const result = res.text.replace(/^```json\s*([\s\S]*?)\s*```$/m, "$1");

      return JSON.parse(result);
    } catch (error) {
      logger.error("Error calling Gemma model:", error);
      throw new Error(
        "Failed to generate response from Gemma model. Please try again later."
      );
    }
  }
  public async getFlashResponse(): Promise<string> {
    try {
      // Slice foodList to first 1000 items for Gemini/Flash
      const slicedFoodList = this.foodList.slice(0, 1000);
      const flashSystemPrompt = AI_PROMPT(
        slicedFoodList,
        this.dateLast,
        this.dailyNutrition
      );

      const res = await this.client.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: flashSystemPrompt,
      });
      const result = res.text.replace(/^```json\s*([\s\S]*?)\s*```$/m, "$1");

      return JSON.parse(result);
    } catch (error) {
      logger.error("Error calling Flash model:", error);
      throw new Error(
        "Failed to generate response from Flash model. Please try again later."
      );
    }
  }
}

export default OpenAIService;
