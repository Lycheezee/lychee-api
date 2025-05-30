import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import { ExerciseRate, MacroPreference } from "../constants/user.enum";
import { CreateUserDTO, UpdateUserDTO } from "../dtos/user.dto";
import User, { IUser } from "../models/user";
import { AuthUser } from "../types/user";
import { calculateBMI } from "../utils/calculateBMI";
import { generateToken } from "../utils/generateToken";
import CacheService from "./cacheService";

export async function createUser(data: CreateUserDTO): Promise<IUser> {
  const user = new User(data);

  return await user.save();
}

export async function registerUser(data: CreateUserDTO): Promise<{
  _id: string;
  email: string;
  token: string;
}> {
  // Check if user already exists
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    throw new Error("User already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create user
  const user = await User.create({
    ...data,
    hashPassword: hashedPassword,
  });

  // Generate token
  const token = generateToken((user._id as ObjectId).toString());

  return {
    _id: (user._id as ObjectId).toString(),
    email: user.email,
    token,
  };
}

export async function loginUser(
  email: string,
  password: string
): Promise<
  AuthUser & {
    accessToken: {
      token: string;
      expiresAt: number;
    };
  }
> {
  // Find user by email
  const { hashPassword, ...user } = await User.findOne({ email }).lean();
  if (!user || !(await bcrypt.compare(password, hashPassword))) {
    throw new Error("Invalid credentials");
  }

  // Cache user information for faster subsequent requests
  CacheService.setUser(user._id.toString(), user);

  // Generate access token
  const accessToken = generateToken(user._id.toString());

  return {
    _id: user._id.toString(),
    ...user,
    accessToken: {
      token: accessToken,
      expiresAt: 60 * 60 * 1000, // 1 hour expiration,
    },
  };
}

export async function getUserProfile(userId: string): Promise<IUser | null> {
  // Try to get user from cache first
  let user = CacheService.getUser(userId);

  if (!user) {
    // If not in cache, fetch from database
    user = await User.findById(userId).select("-hashPassword");
    if (user) {
      // Cache the user for future requests
      CacheService.setUser(userId, user);
    }
  }

  return user;
}

export async function updateUser(
  id: string,
  data: UpdateUserDTO
): Promise<{
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  bodyInfo?: any;
  dietPlan?: string;
} | null> {
  const user = await User.findById(id);
  if (!user) return null;

  // Handle password update if provided
  if ((data as any).password) {
    (data as any).hashPassword = await bcrypt.hash((data as any).password, 10);
    delete (data as any).password;
  }
  // Update user fields
  if (data.firstName !== undefined) user.firstName = data.firstName;
  if (data.lastName !== undefined) user.lastName = data.lastName;
  if (data.middleName !== undefined) user.middleName = data.middleName;
  if (data.gender !== undefined) user.gender = data.gender;
  if (data.dateOfBirth !== undefined) {
    user.dateOfBirth = new Date(data.dateOfBirth);
  }
  if (data.dietPlan !== undefined) user.dietPlan = new ObjectId(data.dietPlan);

  // Update body info if provided
  if (data.bodyInfo) {
    if (!user.bodyInfo) {
      user.bodyInfo = {
        weight: 0,
        height: 0,
        exerciseRate: ExerciseRate.Sedentary, // Default value
        macro_preference: MacroPreference.BALANCED, // Default value
        bmi: 0, // Default value
      };
    }
    if (data.bodyInfo.weight !== undefined)
      user.bodyInfo.weight = data.bodyInfo.weight;
    if (data.bodyInfo.height !== undefined)
      user.bodyInfo.height = data.bodyInfo.height;
    if (data.bodyInfo.exerciseRate !== undefined)
      user.bodyInfo.exerciseRate = data.bodyInfo.exerciseRate;
    if (data.bodyInfo.macro_preference !== undefined)
      user.bodyInfo.macro_preference = data.bodyInfo.macro_preference;

    // Recalculate BMI if weight or height changed
    if (
      data.bodyInfo.weight !== undefined ||
      data.bodyInfo.height !== undefined
    ) {
      user.bodyInfo.bmi = calculateBMI(
        user.bodyInfo.weight,
        user.bodyInfo.height
      );
    }
  }

  // Update hashed password if provided
  if ((data as any).hashPassword) {
    user.hashPassword = (data as any).hashPassword;
  }

  const updatedUser = await user.save();

  // Update cache with new user data
  CacheService.setUser(id, updatedUser);

  return {
    _id: updatedUser._id.toString(),
    email: updatedUser.email,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    middleName: updatedUser.middleName,
    bodyInfo: updatedUser.bodyInfo,
    dietPlan: updatedUser.dietPlan?.toString(),
  };
}

export async function logoutUser(userId: string): Promise<void> {
  // Remove user from cache on logout
  CacheService.removeUser(userId);
}
