import { Router } from "express";
import foodRotes from "./foodRoutes";
import userRoutes from "./userRoutes";

const router = Router();

router.use("/user", userRoutes);
router.use("/food", foodRotes);

router.get("/ready", (_req, res) => {
  res.sendStatus(200);
});

export default router;
