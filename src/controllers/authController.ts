import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import authServices from "../services/auth/authServices";

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authServices.login(req.body);

  res.status(httpStatus.OK).send(result);
});

const register = catchAsync(async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;

  const result = await authServices.register(
    firstName,
    lastName,
    email,
    password,
    confirmPassword
  );

  res.status(httpStatus.OK).send(result);
});

const logout = catchAsync(async (req: Request, res: Response) => {
  const { userId, refreshToken } = req.body;
  await authServices.logout(userId, refreshToken);

  res.status(200).json({});
});

export { login, logout, register };
