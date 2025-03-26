import { Schema, model } from "mongoose";
import { UserRoles } from "../../types/users.type";
import { DbSchema } from "../../types/dbSchema";

const types = Schema.Types;

// User Schema
const user = new Schema(
  {
    email: {
      type: types.String,
      required: true,
      unique: true,
    },
    firstName: {
      type: types.String,
      required: true,
    },
    lastName: {
      type: types.String,
      required: true,
    },
    middleName: {
      type: types.String,
    },
    passwordHash: {
      type: types.String,
      required: true,
    },
    bodyInfo: {
      type: types.ObjectId,
      ref: "bodyInfo",
    },
    dietPlan: {
      type: types.ObjectId,
      ref: "dietPlan",
    },
  },
  { collection: "users", timestamps: true }
);

const UserModel = model("users", user);

export type UserSchema = DbSchema<typeof UserModel.schema>;
export default UserModel;
