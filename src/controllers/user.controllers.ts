import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/user";
import { generateToken } from "../utils/generateToken";
import { CreateUserDTO, UpdateUserDTO } from "../dtos/user.dto";
import { ObjectId } from "mongodb";
import catchAsync from "../utils/catchAsync";
import { calculateBMI } from "../utils/calculateBMI";

export const registerUser = catchAsync(async (req: Request, res: Response) => {
  const data: CreateUserDTO = req.body.payload;

  const existing = await User.findOne({ email: data.email });
  if (existing) return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await User.create({
    ...data,
    hashPassword: hashedPassword,
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

  const accessToken = generateToken(user._id.toString());
  res.json({
    _id: user._id,
    email: user.email,
    accessToken,
  });
});

export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const updateData: UpdateUserDTO = req.body;

  // If password is being updated, hash it (optional, if you want to allow password update)
  if ((updateData as any).password) {
    (updateData as any).hashPassword = await bcrypt.hash(
      (updateData as any).password,
      10
    );
    delete (updateData as any).password;
  }

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (updateData.firstName !== undefined) user.firstName = updateData.firstName;
  if (updateData.lastName !== undefined) user.lastName = updateData.lastName;
  if (updateData.middleName !== undefined)
    user.middleName = updateData.middleName;
  if (updateData.dietPlan !== undefined)
    user.dietPlan = new ObjectId(updateData.dietPlan);
  if (updateData.bodyInfo) {
    if (updateData.bodyInfo.weight !== undefined)
      user.bodyInfo.weight = updateData.bodyInfo.weight;
    if (updateData.bodyInfo.height !== undefined)
      user.bodyInfo.height = updateData.bodyInfo.height;
    if (updateData.bodyInfo.exerciseRate !== undefined)
      user.bodyInfo.exerciseRate = updateData.bodyInfo.exerciseRate;
    // Recalculate BMI if weight or height changed
    if (
      updateData.bodyInfo.weight !== undefined ||
      updateData.bodyInfo.height !== undefined
    ) {
      const weight = user.bodyInfo.weight;
      const height = user.bodyInfo.height;
      user.bodyInfo.bmi = calculateBMI(weight, height);
    }
  }
  if ((updateData as any).hashPassword)
    user.hashPassword = (updateData as any).hashPassword;

  await user.save();

  res.json({
    _id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    middleName: user.middleName,
    bodyInfo: user.bodyInfo,
    dietPlan: user.dietPlan,
  });
});
