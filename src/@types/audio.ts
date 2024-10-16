import { AudioDocument } from "#/models/audio";
import { Request } from "express";
import { ObjectId } from "mongoose";

export type PolulateFavList = AudioDocument<{ _id: ObjectId; name: string }>;

export interface CreatePlaylistRequest extends Request {
  body: { title: string; resId: string; visibility: "public" | "private" };
}
