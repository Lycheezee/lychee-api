// Example usage of the OpenAI service with Flash and Gemma models

import OpenAIService, {
  DietSuggestionResponse,
  FlashResponse,
  FoodSubstitutionResponse,
  GemmaResponse,
} from "../services/AI/openaiService";

/**
 * Example function demonstrating how to use the OpenAI service with type safety
 */
async function exampleUsage() {
  // Get the OpenAI service instance
  const openAIService = OpenAIService.getInstance();

  try {
    // Example 1: Generate diet suggestions using Gemma
    const dietRequest = {
      height: 175,
      weight: 70,
      gender: "male",
      exerciseRate: "moderate",
      macroPreference: "high_protein",
    };

    const dietResponse: GemmaResponse<DietSuggestionResponse> =
      await openAIService.generateDietSuggestions(dietRequest);

    // Type-safe access to the response
    console.log("Diet Suggestions:");
    console.log(`Model used: ${dietResponse.model}`);
    console.log(
      `Total calories: ${dietResponse.content.dailyNutritionSummary.totalCalories}`
    );
    console.log(
      `Total protein: ${dietResponse.content.dailyNutritionSummary.totalProtein}g`
    );

    // Access meal suggestions with proper typing
    dietResponse.content.suggestions.forEach((meal) => {
      console.log(`Meal: ${meal.meal}`);
      console.log(`Foods: ${meal.foods.join(", ")}`);
      console.log(`Calories: ${meal.nutritionInfo.calories}`);
      console.log(`Protein: ${meal.nutritionInfo.protein}g`);
      console.log(`Carbs: ${meal.nutritionInfo.carbs}g`);
      console.log(`Fat: ${meal.nutritionInfo.fat}g`);
      console.log("---");
    });

    // Example 2: Generate food substitutions using Flash
    const food = "chicken breast";
    const restrictions = ["vegetarian"];

    const substitutionResponse: FlashResponse<FoodSubstitutionResponse> =
      await openAIService.generateFoodSubstitutions(food, restrictions);

    // Type-safe access to the response
    console.log("\nFood Substitutions:");
    console.log(`Model used: ${substitutionResponse.model}`);
    console.log(`Original food: ${substitutionResponse.content.originalFood}`);

    // Access substitutions with proper typing
    substitutionResponse.content.substitutions.forEach((sub) => {
      console.log(`Substitute: ${sub.food}`);
      console.log(`Similarity Score: ${sub.similarityScore}`);
      console.log(
        `Calorie difference: ${sub.nutritionComparison.calories.difference}`
      );
      console.log(
        `Protein difference: ${sub.nutritionComparison.protein.difference}g`
      );
      console.log(`Reason: ${sub.reasonForSubstitution}`);
      console.log("---");
    });

    // Example 3: Custom prompt with Gemma (custom response type)
    interface CustomNutritionResponse {
      recipe: {
        name: string;
        ingredients: string[];
        instructions: string[];
        nutritionalValue: {
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
        };
      };
    }

    const customPrompt = `Create a healthy recipe using spinach, eggs, and feta cheese.`;
    const systemPrompt = `You are a chef specializing in healthy, nutritious recipes.`;

    const recipeResponse: GemmaResponse<CustomNutritionResponse> =
      await openAIService.getGemmaResponse<CustomNutritionResponse>(
        customPrompt,
        systemPrompt
      );

    // Type-safe access to the custom response
    console.log("\nCustom Recipe:");
    console.log(`Model used: ${recipeResponse.model}`);
    console.log(`Recipe: ${recipeResponse.content.recipe.name}`);
    console.log(
      `Ingredients: ${recipeResponse.content.recipe.ingredients.join(", ")}`
    );
    console.log(
      `Calories: ${recipeResponse.content.recipe.nutritionalValue.calories}`
    );
  } catch (error) {
    console.error("Error in example usage:", error);
  }
}

// Run the example
// exampleUsage().catch(console.error);

export default exampleUsage;
