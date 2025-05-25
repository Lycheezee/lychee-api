import { IUser } from "../models/user";

export type AuthUser = Omit<IUser, "hashPassword">;
