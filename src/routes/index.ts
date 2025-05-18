import { Application } from "express";
import userRoutes from "./userRoutes";
import foodRotes from "./foodRoutes";

const router = (app: Application) => {
  app.use("user", userRoutes);
  app.use("food", foodRotes);
};

export default router;
