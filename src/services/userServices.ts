import { CreateUserDTO, UpdateUserDTO } from "../dtos/user.dto";
import User, { IUser } from "../models/user";
import { ObjectId } from "mongodb";
import { calculateBMI } from "../utils/calculateBMI";

export async function createUser(data: CreateUserDTO): Promise<IUser> {
  const user = new User(data);

  return await user.save();
}

export async function updateUser(
  id: string,
  data: UpdateUserDTO
): Promise<IUser | null> {
  const user = await User.findById(id);
  if (!user) return null;

  if (data.firstName !== undefined) user.firstName = data.firstName;
  if (data.lastName !== undefined) user.lastName = data.lastName;
  if (data.middleName !== undefined) user.middleName = data.middleName;
  if (data.dietPlan !== undefined) user.dietPlan = new ObjectId(data.dietPlan);

  if (data.bodyInfo) {
    if (data.bodyInfo.weight !== undefined)
      user.bodyInfo.weight = data.bodyInfo.weight;
    if (data.bodyInfo.height !== undefined)
      user.bodyInfo.height = data.bodyInfo.height;
    if (data.bodyInfo.exerciseRate !== undefined)
      user.bodyInfo.exerciseRate = data.bodyInfo.exerciseRate;

    user.bodyInfo.bmi = calculateBMI(
      user.bodyInfo.weight,
      user.bodyInfo.height
    );
  }

  return await user.save();
}
