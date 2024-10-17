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
      file: { url: audioResponse.url, publicId: audioResponse.public_id },
    });

    const uploadPoster = poster ? poster[0] : null;
    if (uploadPoster) {
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
