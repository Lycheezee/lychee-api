import express from "express";
import {
  createDietPlan,
  deleteDietPlan,
  getAllDietPlans,
  getDietPlan,
  updateDietPlan,
  updateDietPlanWithAI,
  updateMealStatus,
} from "../controllers/dietPlan.controllers";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(protect);

router.post("/", createDietPlan);
router.get("/", getAllDietPlans);

router.get("/:id", getDietPlan);

router.put("/:id", updateDietPlan);
router.put("/regen-with-ai/:id", updateDietPlanWithAI);

router.delete("/:id", deleteDietPlan);

router.patch("/:id/meal-status", updateMealStatus);

export default router;
