import { CreatePlaylistRequest, UpdatePlaylistRequest } from "#/@types/audio";
import Audio from "#/models/audio";
import Playlist from "#/models/playlist";
import { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";

export const createPlaylist: RequestHandler = async (
  req: CreatePlaylistRequest,
  res
): Promise<any> => {
  // resId is audio id
  const { title, resId, visibility } = req.body;
  const ownerId = req.user.id;

  if (resId) {
    const audio = await Audio.findById(resId);
    if (!audio)
      return res.status(404).json({ message: "Could not found the audio" });
  }

  const newPlaylist = new Playlist({
    title,
    owner: ownerId,
    visibility,
  });

  if (resId) newPlaylist.items = [resId as any];
  await newPlaylist.save();

  res.status(201).json({
    playlist: {
      id: newPlaylist._id,
      title: newPlaylist.title,
      visibility: newPlaylist.visibility,
    },
  });
};

export const updatePlaylist: RequestHandler = async (
  req: UpdatePlaylistRequest,
  res
): Promise<any> => {
  const { title, id, item, visibility } = req.body;

  const playlist = await Playlist.findOneAndUpdate(
    { _id: id, owner: req.user.id },
    { title, visibility },
    { new: true }
  );

  if (!playlist)
    return res.status(404).json({ message: "Playlist not found!" });

  if (item) {
    const audio = await Audio.findById(item);
    if (!audio) return res.status(404).json({ message: "Audio not found!" });
    // playlist.items.push(audio._id);
    // await playlist.save();
    await Playlist.findByIdAndUpdate(playlist._id, {
      $addToSet: { items: item },
    });
  }
  return res.status(200).json({
    playlist: {
      id: playlist._id,
      title: playlist.title,
      visibility: playlist.visibility,
    },
  });
};

export const removePlaylist: RequestHandler = async (
  req,
  res
): Promise<any> => {
  const { playlistId, resId, all } = req.query;

  if (!isValidObjectId(playlistId))
    return res.status(422).json({ message: "Invalid playlist id!" });

  if (all === "yes") {
    const playlist = await Playlist.findOneAndDelete({
      _id: playlistId,
      owner: req.user.id,
    });

    if (!playlist)
      return res.status(404).json({ message: "Playlist not found!" });
  }

  if (resId) {
    if (!isValidObjectId(resId))
      return res.status(422).json({ message: "Invalid audio id!" });

    const playlist = await Playlist.findOneAndUpdate(
      {
        _id: playlistId,
        owner: req.user.id,
      },
      { $pull: { items: resId } }
    );

    if (!playlist)
      return res.status(404).json({ message: "Playlist not found!" });
  }

  return res.status(200).json({ message: "success", success: true });
};

export const getPlaylistByProfile: RequestHandler = async (
  req,
  res
): Promise<any> => {
  const data = await Playlist.find({
    owner: req.user.id,
    visibility: { $ne: "auto" },
  }).sort("-createdAt");

  const playlist = data.map((item) => {
    const { _id: id, title, items, visibility } = item;
    return {
      id,
      title,
      itemsCount: items.length,
      visibility,
    };
  });

  return res.status(200).json({ playlist });
};
