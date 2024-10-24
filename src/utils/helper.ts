import History from "#/models/history";
import { UserDocument } from "#/models/user";
import { Request } from "express";
import moment from "moment";

export const generateToken = (lengnth: number = 6) => {
  let otp: string = "";

  for (let i = 0; i < lengnth; i++) {
    const digit = Math.floor(Math.random() * 10);
    otp += digit;
  }

  return otp;
};

export const formatProfile = (user: UserDocument) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    verified: user.verified,
    avatar: user.avatar?.url,
    followers: user.followers.length,
    following: user.following.length,
  };
};

export const getUserPreviousHistory = async (req: Request) => {
  const [result] = await History.aggregate([
    { $match: { owner: req.user.id } },
    { $unwind: "$all" },
    {
      $match: {
        "all.date": {
          // only take history not longer than 30days
          $gte: moment().subtract(30, "days").toDate(),
        },
      },
    },
    { $group: { _id: "$all.audio" } },
    {
      $lookup: {
        from: "audios",
        localField: "_id",
        foreignField: "_id",
        as: "audioData",
      },
    },
    { $unwind: "$audioData" },
    { $group: { _id: null, category: { $addToSet: "$audioData.category" } } },
  ]);

  return result;
};
