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
  accessToken: {
    token: string;
    expiresAt: number;
  };
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

  // Cache user information for faster subsequent requests
  const userWithoutPassword = { ...user.toObject(), hashPassword: undefined };
  CacheService.setUser((user._id as ObjectId).toString(), userWithoutPassword);

  return {
    _id: (user._id as ObjectId).toString(),
    email: user.email,
    accessToken: {
      token,
      expiresAt: 60 * 60 * 1000, // 1 hour expiration,
    },
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
  // Find user by email with populated fields
  const userDocument = await User.findOne({ email })
    .populate({
      path: "dietPlan",
      populate: {
        path: "plan.meals.foodId",
        model: "Food",
      },
    })
    .lean();

  if (
    !userDocument ||
    !(await bcrypt.compare(password, userDocument.hashPassword))
  ) {
    throw new Error("Invalid credentials");
  }

  // Remove hashPassword for security and create a properly typed user object
  const { hashPassword, ...userWithoutPassword } = userDocument;

  // Cache user information with all populated fields for faster subsequent requests
  CacheService.setUser(
    userWithoutPassword._id.toString(),
    userWithoutPassword as any
  );

  // Generate access token
  const accessToken = generateToken(userWithoutPassword._id.toString());

  return {
    _id: userWithoutPassword._id.toString(),
    ...userWithoutPassword,
    accessToken: {
      token: accessToken,
      expiresAt: 60 * 60 * 1000, // 1 hour expiration,
    },
  } as unknown as AuthUser & {
    accessToken: {
      token: string;
      expiresAt: number;
    };
  };
}

export async function getUserProfile(userId: string): Promise<IUser | null> {
  // Try to get user from cache first
  let user = CacheService.getUser(userId);

  if (!user) {
    // If not in cache, fetch from database with all populated fields
    user = await User.findById(userId)
      .select("-hashPassword")
      .populate({
        path: "dietPlan",
        populate: {
          path: "plan.meals.foodId",
          model: "Food",
        },
      })
      .lean();

    if (user) {
      // Cache the user with all populated fields for future requests
      user = user as IUser;
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

  // Get the updated user with all populated fields for caching
  const userWithPopulatedFields = await User.findById(id)
    .select("-hashPassword")
    .populate({
      path: "dietPlan",
      populate: {
        path: "plan.meals.foodId",
        model: "Food",
      },
    })
    .lean();

  // Update cache with new user data including all populated fields
  if (userWithPopulatedFields) {
    CacheService.setUser(id, userWithPopulatedFields as IUser);
  }

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
