import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import router from "./routes";
import logger from "./utils/logger";

const start = async () => {
  dotenv.config();

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Log incoming requests
  app.use((req, res, next) => {
    logger.info(`[${req.method}] ${req.originalUrl}`);
    next();
  });

  app.use("/api", router);
  logger.info("API routes initialized");
  // DB connection
  mongoose
    .connect(`${process.env.MONGO_URI}${process.env.DATABASE_NAME}` || "", {})
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));

  // Cloud Run requires listening on process.env.PORT and 0.0.0.0
  const port = +process.env.PORT || 8080;
  logger.info(`Listening on port ${port}`);
  
  app.listen(port, "0.0.0.0", () => {
    logger.info(`Server started at http://0.0.0.0:${port}`);
  });

  process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception: ", err);
  });
};

start()
  .then(() => {
    logger.info("Server started successfully");
  })
  .catch((err) => {
    logger.error("Error starting server: ", err);
  });
