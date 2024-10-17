import { AudioDocument } from "#/models/audio";
import { ObjectId } from "mongoose";

export type PolulateFavList = AudioDocument<{ _id: ObjectId; name: string }>;
