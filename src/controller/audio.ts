import { PopulateFavList } from "#/@types/audio";
import cloudinary from "#/cloud";
import { RequestWithFiles } from "#/middleware/fileParser";
import Audio from "#/models/audio";
import { categoriesTypes } from "#/utils/audio_category";
import { RequestHandler } from "express";
import formidable from "formidable";

interface CreateAudioCategory extends RequestWithFiles {
  body: { title: string; about: string; category: categoriesTypes };
}

export const createAudio: RequestHandler = async (
  req: CreateAudioCategory,
  res
): Promise<any> => {
  const { title, about, category } = req.body;
  const poster = req.files?.poster as formidable.File[];
  const audioFile = req.files?.file as formidable.File[];
  const ownerId = req.user.id;

  try {
    const uploadAudio = audioFile ? audioFile[0] : null;
    if (!uploadAudio)
      return res.status(422).json({ message: "Audio file is required!" });

    const audioResponse = await cloudinary.uploader.upload(
      uploadAudio.filepath,
      {
        resource_type: "video",
      }
    );

    const newAudio = new Audio({
      title,
      about,
      category,
      owner: ownerId,
      file: { url: audioResponse.secure_url, publicId: audioResponse.public_id },
    });

    const uploadPoster = poster ? poster[0] : null;
    if (uploadPoster && uploadPoster.filepath) {
      const posterResponse = await cloudinary.uploader.upload(
        uploadPoster.filepath,
        {
          width: 300,
          height: 300,
          crop: "thumb",
          gravity: "face",
        }
      );

      newAudio.poster = {
        url: posterResponse.secure_url,
        publicId: posterResponse.public_id,
      };
    }

    await newAudio.save();

    return res.status(201).json({
      audio: {
        title,
        about,
        file: newAudio.file.url,
        poster: newAudio.poster?.url,
      },
    });
  } catch (error) {
    console.error("Error upload audio:", error);
    return res.status(500).json({ error: "Failed to upload audio" });
  }
};

export const updateAudio: RequestHandler = async (
  req: CreateAudioCategory,
  res
): Promise<any> => {
  const { title, about, category } = req.body;
  const poster = req.files?.poster as formidable.File[];
  const ownerId = req.user.id;
  const { audioId } = req.params;

  try {
    const audio = await Audio.findOneAndUpdate(
      { owner: ownerId, _id: audioId },
      { title, about, category },
      { new: true }
    );

    if (!audio) return res.status(404).json({ message: "Record not found" });

    const uploadPoster = poster ? poster[0] : null;
    if (uploadPoster && uploadPoster.filepath) {
      if (audio.poster?.publicId) {
        // delete old poster
        await cloudinary.uploader.destroy(audio.poster.publicId);
      }

      const posterResponse = await cloudinary.uploader.upload(
        uploadPoster.filepath,
        {
          width: 300,
          height: 300,
          crop: "thumb",
          gravity: "face",
        }
      );

      audio.poster = {
        url: posterResponse.secure_url,
        publicId: posterResponse.public_id,
      };

      await audio.save();
    }

    return res.status(200).json({
      audio: {
        title,
        about,
        file: audio.file.url,
        poster: audio.poster?.url,
      },
    });
  } catch (error) {
    console.error("Error update audio:", error);
    return res.status(500).json({ error: "Failed to update audio" });
  }
};

export const getLatestUpload: RequestHandler = async (
  req,
  res
): Promise<any> => {
  const list = await Audio.find()
    .sort("-createdAt")
    .limit(10)
    .populate<PopulateFavList>("owner");
  const audios = list.map((item) => {
    return {
      id: item._id,
      title: item.title,
      about: item.about,
      category: item.category,
      file: item.file.url,
      poster: item.poster?.url,
      owner: {
        name: item.owner.name,
        id: item.owner._id,
      },
    };
  });

  return res.status(200).json({ audios });
};
