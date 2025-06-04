import { OpenAI } from "openai";
import logger from "../../utils/logger";

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
  private client: OpenAI;
  private static instance: OpenAIService;

  private constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }

    this.client = new OpenAI({
      apiKey: apiKey,
    });
  }

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  /**
   * Generate a response using Gemma model with type safety
   * @param prompt The prompt to send to the model
   * @param systemPrompt Optional system prompt to guide the model
   * @returns Typed response from the Gemma model
   */
  public async getGemmaResponse<T>(
    prompt: string,
    systemPrompt?: string
  ): Promise<GemmaResponse<T>> {
    try {
      const messages: Array<OpenAI.Chat.ChatCompletionMessageParam> = [];

      if (systemPrompt) {
        messages.push({
          role: "system",
          content: systemPrompt,
        });
      }

      messages.push({
        role: "user",
        content: prompt,
      });

      const response = await this.client.chat.completions.create({
        model: "gemma-3-27b-it",
        messages: messages,
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      // Parse the content to the expected type
      const content = JSON.parse(
        response.choices[0].message.content || "{}"
      ) as T;

      return {
        model: response.model,
        content,
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      logger.error("Error calling Gemma model:", error);
      throw new Error(
        "Failed to generate response from Gemma model. Please try again later."
      );
    }
  }

  /**
   * Generate a response using Flash model with type safety
   * @param prompt The prompt to send to the model
   * @param systemPrompt Optional system prompt to guide the model
   * @returns Typed response from the Flash model
   */
  public async getFlashResponse<T>(
    prompt: string,
    systemPrompt?: string
  ): Promise<FlashResponse<T>> {
    try {
      const messages: Array<OpenAI.Chat.ChatCompletionMessageParam> = [];

      if (systemPrompt) {
        messages.push({
          role: "system",
          content: systemPrompt,
        });
      }

      messages.push({
        role: "user",
        content: prompt,
      });

      const response = await this.client.chat.completions.create({
        model: "gemini-2.0-flash-001", // Using GPT-4o Flash as a stand-in for Flash
        messages: messages,
        response_format: { type: "json_object" }, // Ensure response is JSON for parsing
        temperature: 0.3, // Lower temperature for more deterministic outputs
      });

      // Parse the content to the expected type
      const content = JSON.parse(
        response.choices[0].message.content || "{}"
      ) as T;

      return {
        model: response.model,
        content,
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      logger.error("Error calling Flash model:", error);
      throw new Error(
        "Failed to generate response from Flash model. Please try again later."
      );
    }
  }

  /**
   * Generate diet suggestions based on user preferences
   * @param userPreferences User dietary preferences and restrictions
   * @returns Diet suggestions with nutrition information
   */
  public async generateDietSuggestions(userPreferences: {
    height: number;
    weight: number;
    gender: string;
    exerciseRate: string;
    macroPreference: string;
    allergies?: string[];
    dietaryRestrictions?: string[];
  }): Promise<GemmaResponse<DietSuggestionResponse>> {
    const systemPrompt = `You are a nutrition expert assistant. 
    Generate a structured meal plan with nutritional information. 
    Provide a JSON response with meal suggestions organized by meal type 
    and including nutritional breakdown.`;

    const prompt = `
    Create a meal plan for a person with the following characteristics:
    - Height: ${userPreferences.height} cm
    - Weight: ${userPreferences.weight} kg
    - Gender: ${userPreferences.gender}
    - Exercise Rate: ${userPreferences.exerciseRate}
    - Macro Preference: ${userPreferences.macroPreference}
    
    The response should be a valid JSON object with the structure matching DietSuggestionResponse type.
    `;

    return await this.getGemmaResponse<DietSuggestionResponse>(
      prompt,
      systemPrompt
    );
  }

  /**
   * Generate food substitution recommendations
   * @param food Food to find substitutes for
   * @param restrictions Any dietary restrictions to consider
   * @returns List of substitution options with nutritional comparison
   */
  public async generateFoodSubstitutions(
    food: string,
    restrictions?: string[]
  ): Promise<FlashResponse<FoodSubstitutionResponse>> {
    const systemPrompt = `You are a nutrition expert assistant. 
    Provide suitable food substitutions with detailed nutritional comparison.
    Structure your response as a JSON object.`;

    const prompt = `
    Find nutritionally similar substitutes for ${food}.
    ${
      restrictions
        ? `Consider these dietary restrictions: ${restrictions.join(", ")}`
        : ""
    }
    
    The response should be a valid JSON object with the structure matching FoodSubstitutionResponse type.
    `;

    return await this.getFlashResponse<FoodSubstitutionResponse>(
      prompt,
      systemPrompt
    );
  }
}

export default OpenAIService;
