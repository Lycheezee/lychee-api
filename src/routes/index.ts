import { Router } from "express";
import userRoutes from "./userRoutes";
import foodRotes from "./foodRoutes";

const router = Router();

router.use("/user", userRoutes);
router.use("/food", foodRotes);

router.get("/ready", (_req, res) => {
  res.sendStatus(200);
});

export default router;
