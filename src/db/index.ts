import mongoose from "mongoose";
import { MONGO_URI } from "#/utils/variable";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("db is connected");
  })
  .catch((err: unknown) => {
    console.log("error to connect db", err);
  });
