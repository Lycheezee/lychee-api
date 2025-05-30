import express from "express";
import {
  generateMealPlan,
  generateMealPlanWithData,
  testAIConnection,
  validateUserForMealPlan,
} from "../controllers/mealPlan.controllers";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

// Public route for testing AI connection
router.post("/test-connection", testAIConnection);

// Protected routes - require authentication
router.use(protect);

// Generate meal plan for current authenticated user
router.post("/generate", generateMealPlan);

// Generate meal plan with custom data (for testing or overrides)
router.post("/generate-with-data", generateMealPlanWithData);

// Check if current user has all required data for meal plan generation
router.get("/validate-user", validateUserForMealPlan);

export default router;
