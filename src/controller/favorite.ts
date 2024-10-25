import { PopulateFavList } from "#/@types/audio";
import { PaginationQuery } from "#/@types/misc";
import Audio, { AudioDocument } from "#/models/audio";
import Favorite from "#/models/favorite";
import { RequestHandler } from "express";
import { isValidObjectId, ObjectId } from "mongoose";

export const toggleFavorite: RequestHandler = async (
  req,
  res
): Promise<any> => {
  const audioId = req.query.audioId as string;
  let status: "added" | "remove";

  if (!isValidObjectId(audioId))
    return res.status(422).json({ message: "Audio ID is invalid!" });

  const audio = await Audio.findById(audioId);
  if (!audio) return res.status(404).json({ message: "Resource not found!" });

  // handle the audio already in favorite list
  const alreadyExist = await Favorite.findOne({
    owner: req.user.id,
    items: audioId,
  });

  if (alreadyExist) {
    // we want to remove from old lists
    await Favorite.updateOne(
      { owner: req.user.id },
      {
        $pull: { items: audioId },
      }
    );
    status = "remove";
  } else {
    const favorite = await Favorite.findOne({ owner: req.user.id });
    if (favorite) {
      // user try to add new audio to the old list
      await Favorite.updateOne(
        { owner: req.user.id },
        {
          $addToSet: { items: audioId },
        }
      );
    } else {
      //  if user try to create fresh favorite list
      await Favorite.create({ owner: req.user.id, items: [audioId] });
    }
    status = "added";
  }

  if (status === "added") {
    await Audio.findByIdAndUpdate(audioId, {
      $addToSet: { likes: req.user.id },
    });
  }

  if (status === "remove") {
    await Audio.findByIdAndUpdate(audioId, {
      $pull: { likes: req.user.id },
    });
  }

  return res.status(200).json({ message: "Success!", status });
};

export const getFavorites: RequestHandler = async (req, res): Promise<any> => {
  const userId = req.user.id;
  const { limit = "10", pageNo = "0" } = req.query as PaginationQuery;

  const favorites = await Favorite.aggregate([
    { $match: { owner: req.user.id } },
    {
      $project: {
        audioIds: {
          $slice: [
            "$items",
            parseInt(limit) * parseInt(pageNo),
            parseInt(limit),
          ],
        },
      },
    },
    { $unwind: "$audioIds" },
    {
      $lookup: {
        from: "audios",
        localField: "audioIds",
        foreignField: "_id",
        as: "audioInfo",
      },
    },
    { $unwind: "$audioInfo" },
    {
      $lookup: {
        from: "users",
        localField: "audioInfo.owner",
        foreignField: "_id",
        as: "ownerInfo",
      },
    },
    { $unwind: "$ownerInfo" },
    {
      $project: {
        id: "$audioInfo._id",
        title: "$audioInfo.title",
        about: "$audioInfo.about",
        category: "$audioInfo.category",
        file: "$audioInfo.file.url",
        poster: "$audioInfo.poster.url",
        owner: { name: "$ownerInfo.name", id: "$ownerInfo._id" },
      },
    },
  ]);
  return res.json({ audios: favorites });
};

export const getIsFavorite: RequestHandler = async (req, res): Promise<any> => {
  const audioId = req.query.audioId as string;
  if (!isValidObjectId(audioId))
    return res.status(422).json({ message: "Invalid audio id!" });

  const favorite = await Favorite.findOne({
    owner: req.user.id,
    items: audioId,
  });

  return res.status(200).json({ result: favorite ? true : false });
};
