import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateUser,
} from "../controllers/user.controllers";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.use(protect);

router.put("/update", updateUser);
router.get("/profile", getProfile);

export default router;
