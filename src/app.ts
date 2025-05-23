import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import router from "./routes";
import logger from "./utils/logger";

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

// DB connection
mongoose
  .connect(`${process.env.MONGO_URI}${process.env.DATABASE_NAME}` || "", {})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const port = +process.env.PORT || 8080;
const host = process.env.HOST || "localhost";
app.listen(port, host, () => {
  logger.info(`Server started at http://${host}:${port}`);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception: ", err);
});
