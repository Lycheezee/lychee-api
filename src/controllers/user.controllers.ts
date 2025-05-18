import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/user";
import { generateToken } from "../utils/generateToken";
import { CreateUserDTO } from "../dtos/user.dto";
import { calculateBMI } from "../utils/calculateBMI";
import { ObjectId } from "mongodb";
import catchAsync from "../utils/catchAsync";

export const registerUser = catchAsync(async (req: Request, res: Response) => {
  const data: CreateUserDTO = req.body;

  const existing = await User.findOne({ email: data.email });
  if (existing) return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(data.hashPassword, 10);
  const bmi = calculateBMI(data.bodyInfo.weight, data.bodyInfo.height);

  const user = await User.create({
    ...data,
    hashPassword: hashedPassword,
    bodyInfo: { ...data.bodyInfo, bmi },
  });

  res.status(201).json({
    _id: user._id,
    email: user.email,
    token: generateToken((user._id as ObjectId).toString()),
  });
});

export const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.hashPassword)))
    return res.status(401).json({ message: "Invalid credentials" });

  res.json({
    _id: user._id,
    email: user.email,
    token: generateToken((user._id as ObjectId).toString()),
  });
});

export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});
