import { PaginationQuery } from "#/@types/misc";
import Audio, { AudioDocument } from "#/models/audio";
import Playlist from "#/models/playlist";
import User from "#/models/user";
import { RequestHandler } from "express";
import { isValidObjectId, ObjectId } from "mongoose";

export const updateFollower: RequestHandler = async (
  req,
  res
): Promise<any> => {
  const { profileId } = req.params;
  let status: "added" | "removed";
  if (!isValidObjectId(profileId))
    return res.status(422).json({ message: "Invalid profile id!" });

  const profile = await User.findById(profileId);
  if (!profile) return res.status(404).json({ message: "Profile not found!" });

  const alreadyFollower = await User.findOne({
    _id: profileId,
    followers: req.user.id,
  });

  if (alreadyFollower) {
    // unfollow user
    await User.updateOne(
      { _id: profileId },
      { $pull: { followers: req.user.id } }
    );
    status = "removed";
  } else {
    // follow user
    await User.updateOne(
      { _id: profileId },
      { $addToSet: { followers: req.user.id } }
    );
    status = "added";
  }

  if (status === "added") {
    // update and add the following list
    await User.updateOne(
      { _id: req.user.id },
      { $addToSet: { following: profileId } }
    );
  }

  if (status === "removed") {
    // update and remove the following list
    await User.updateOne(
      { _id: req.user.id },
      { $pull: { following: profileId } }
    );
  }

  return res.status(200).json({ status });
};

export const getUploads: RequestHandler = async (req, res): Promise<any> => {
  const { pageNo = "0", limit = "10" } = req.query as PaginationQuery;

  const data = await Audio.find({ owner: req.user.id })
    .skip(parseInt(limit) * parseInt(pageNo))
    .limit(parseInt(limit))
    .sort("-createdAt");

  const audios = data.map((item) => {
    return {
      id: item._id,
      title: item.title,
      about: item.about,
      file: item.file.url,
      poster: item.poster?.url,
      date: item.createdAt,
      owner: {
        id: req.user.id,
        name: req.user.name,
      },
    };
  });

  return res.status(200).json({ audios });
};

export const getPublicUploads: RequestHandler = async (
  req,
  res
): Promise<any> => {
  const { pageNo = "0", limit = "10" } = req.query as PaginationQuery;
  const { profileId } = req.params;

  if (!isValidObjectId(profileId))
    return res.status(422).json({ message: "Invalid profile id!" });

  const data = await Audio.find({ owner: profileId })
    .skip(parseInt(limit) * parseInt(pageNo))
    .limit(parseInt(limit))
    .sort("-createdAt")
    .populate<AudioDocument<{ name: string; _id: ObjectId }>>("owner");

  const audios = data.map((item) => {
    return {
      id: item._id,
      title: item.title,
      about: item.about,
      file: item.file.url,
      poster: item.poster?.url,
      date: item.createdAt,
      owner: {
        id: item.owner._id,
        name: item.owner.name,
      },
    };
  });

  return res.status(200).json({ audios });
};

export const getPublicProfile: RequestHandler = async (
  req,
  res
): Promise<any> => {
  const { profileId } = req.params;

  if (!isValidObjectId(profileId))
    return res.status(422).json({ message: "Invalid profile id!" });

  const user = await User.findById(profileId);
  if (!user) return res.status(422).json({ message: "User not found!" });

  return res.json({
    profile: {
      id: user._id,
      name: user.name,
      followers: user.followers.length,
      avatar: user.avatar?.url,
    },
  });
};

export const getPublicPlaylist: RequestHandler = async (
  req,
  res
): Promise<any> => {
  const { pageNo = "0", limit = "10" } = req.query as PaginationQuery;
  const { profileId } = req.params;

  if (!isValidObjectId(profileId))
    return res.status(422).json({ message: "Invalid profile id!" });

  const playlists = await Playlist.find({
    owner: profileId,
    visibility: "public",
  })
    .skip(parseInt(limit) * parseInt(pageNo))
    .limit(parseInt(limit))
    .sort("-createdAt");

  if (!playlists) return res.status(200).json({ playlist: [] });

  return res.status(200).json({
    playlists: playlists.map((item) => {
      return {
        id: item._id,
        title: item.title,
        itemCount: item.items.length,
        visibility: item.visibility,
      };
    }),
  });
};
