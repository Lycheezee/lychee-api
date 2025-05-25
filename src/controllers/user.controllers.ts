import { Request, Response } from "express";
import { CreateUserDTO, UpdateUserDTO } from "../dtos/user.dto";
import * as userService from "../services/userServices";
import catchAsync from "../utils/catchAsync";

export const registerUser = catchAsync(async (req: Request, res: Response) => {
  try {
    const data: CreateUserDTO = req.body.payload;
    const result = await userService.registerUser(data);
    res.status(201).json(result);
  } catch (error: any) {
    if (error.message === "User already exists") {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }
});

export const loginUser = catchAsync(async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await userService.loginUser(email, password);
    res.json(result);
  } catch (error: any) {
    if (error.message === "Invalid credentials") {
      return res.status(401).json({ message: error.message });
    }
    throw error;
  }
});

export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const user = await userService.getUserProfile(userId.toString());
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json(user);
});

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const updateData: UpdateUserDTO = { bodyInfo: req.body };
  const result = await userService.updateUser(userId.toString(), updateData);

  if (!result) return res.status(404).json({ message: "User not found" });

  res.json(result);
});

export const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (userId) {
    await userService.logoutUser(userId.toString());
  }

  res.json({ message: "Logged out successfully" });
});
