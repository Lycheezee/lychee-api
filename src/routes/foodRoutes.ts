import express from "express";
import {
  createFood,
  getFood,
  getAllFoods,
  updateFood,
  deleteFood,
} from "../controllers/food.controllers";
import { protect } from "../middlewares/authMiddleware";
import { upload } from "../configs/multer";

const router = express.Router();

router.use(protect);

router.post("/", protect, upload.array("images", 5), createFood);

router.get("/", getAllFoods);
router.get("/:id", getFood);

router.put("/:id", updateFood);

router.delete("/:id", deleteFood);

export default router;
