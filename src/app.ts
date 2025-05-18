import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import router from "./routes";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api", router); // Route registration

// DB connection
mongoose
  .connect(process.env.MONGO_URI || "", {})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

export default app;
