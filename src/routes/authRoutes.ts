import { login, logout, register } from "../controllers/authController";
import { Router } from "express";

const router = Router();

//Post
router.post("/signup", register);
router.post("/login", login);
router.post("/logout", logout);

export default router;
