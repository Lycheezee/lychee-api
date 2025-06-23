import express from "express";
import {
  createDietPlan,
  deleteDietPlan,
  getAiPlans,
  getAllDietPlans,
  getDietPlan,
  updateDietPlan,
  updateDietPlanWithAI,
  updateMealStatus,
  updateMealStatusBatch,
} from "../controllers/dietPlan.controllers";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(protect);

router.post("/", createDietPlan);
router.get("/", getAllDietPlans);

router.get("/:id", getDietPlan);
router.get("/:id/ai-plans", getAiPlans);

router.put("/:id", updateDietPlan);
router.post("/regen-with-ai/:id", updateDietPlanWithAI);

router.delete("/:id", deleteDietPlan);

router.patch("/:id/meal-status", updateMealStatus);
router.patch("/:id/meal-status/batch", updateMealStatusBatch);

export default router;
