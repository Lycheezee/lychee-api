import { GoogleGenAI } from "@google/genai";
import { IFood } from "../../models/food";
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

  private foodList: IFood[] = [];
  private dateLast: number = 7; // Default to 7 days
  private systemPrompt: string = "";

  private static instance: OpenAIService;

  public constructor(user: IUser, foodList: IFood[], dateLast?: number) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }

    this.client = new GoogleGenAI({
      apiKey: apiKey,
    });
    this.dateLast = dateLast;
    this.foodList = foodList;
    this.systemPrompt = AI_PROMPT(foodList, dateLast, user.bodyInfo);
  }

  public async getGemmaResponse(): Promise<string> {
    try {
      const res = await this.client.models.generateContent({
        model: "gemma-3-27b-it",
        contents: this.systemPrompt,
      });

      const result = res.text;

      return result;
    } catch (error) {
      logger.error("Error calling Gemma model:", error);
      throw new Error(
        "Failed to generate response from Gemma model. Please try again later."
      );
    }
  }

  public async getFlashResponse(): Promise<string> {
    try {
      const res = await this.client.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: this.systemPrompt,
      });

      const result = res.text;
      return result;
    } catch (error) {
      logger.error("Error calling Flash model:", error);
      throw new Error(
        "Failed to generate response from Flash model. Please try again later."
      );
    }
  }
}

export default OpenAIService;
