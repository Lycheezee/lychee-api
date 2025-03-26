import { ObjectId } from "mongodb";
import { Schema } from "mongoose";

export type DbSchema<C extends Schema> = (C extends Schema<infer T>
  ? T
  : unknown) & { _id: ObjectId };

export type DTOType<T> = {
  [K in keyof T]?: T[K] extends ObjectId ? string : T[K];
};
