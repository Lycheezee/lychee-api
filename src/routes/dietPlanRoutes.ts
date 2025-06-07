import express from "express";
import {
  createDietPlan,
  deleteDietPlan,
  getAllDietPlans,
  getDietPlan,
  updateDietPlan,
  updateMealStatus,
} from "../controllers/dietPlan.controllers";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

// All routes require authentication
router.use(protect);

// CRUD operations for diet plans
router.post("/", createDietPlan);
router.get("/", getAllDietPlans);

router.get("/:id", getDietPlan);

router.put("/:id", updateDietPlan);
router.delete("/:id", deleteDietPlan);

// Meal status update endpoint
router.patch("/:id/meal-status", updateMealStatus);

export default router;
