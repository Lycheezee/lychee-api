import { Router } from "express";
import userRoutes from "./userRoutes";
import foodRotes from "./foodRoutes";

const router = Router();

router.use("/user", userRoutes);
router.use("/food", foodRotes);

export default router;
