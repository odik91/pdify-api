import { PaginationQuery } from "#/@types/misc";
import History, { HistoryType } from "#/models/history";
import { RequestHandler } from "express";

export const updateHistory: RequestHandler = async (req, res): Promise<any> => {
  const oldHistory = await History.findOne({ owner: req.user.id });
  const { audio, progress, date } = req.body;
  const history: HistoryType = { audio, progress, date };

  if (!oldHistory) {
    await History.create({
      owner: req.user.id,
      last: history,
      progress,
      all: [history],
    });
    return res.status(201).json({ message: "success" });
  }

  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  );

  const histories = await History.aggregate([
    { $match: { owner: req.user.id } },
    { $unwind: "$all" },
    {
      $match: {
        "all.date": {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      },
    },
    {
      $project: {
        _id: 0,
        audio: "$all.audio",
      },
    },
  ]);

  const sameDayHistory = histories.find((item) => {
    if (item.audio.toString() === audio) return item;
  });

  if (sameDayHistory) {
    await History.findOneAndUpdate(
      {
        owner: req.user.id,
        "all.audio": audio,
      },
      {
        $set: {
          "all.$.progress": progress,
          "all.$.date": date,
        },
      }
    );
  } else {
    await History.findByIdAndUpdate(oldHistory._id, {
      $push: { all: { $each: [history], $position: 0 } },
      $set: { last: history },
    });
  }

  return res.status(200).json({ success: true });
};

export const removeHistory: RequestHandler = async (req, res): Promise<any> => {
  const removeAll = req.query.all == "yes";

  if (removeAll) {
    await History.findOneAndDelete({ owner: req.user.id });
    return res.json({ success: true });
  }

  const histories = req.query.histories as string;
  const ids = JSON.parse(histories) as string[];
  await History.findOneAndUpdate(
    { owner: req.user.id },
    { $pull: { all: { _id: ids } } }
  );

  return res.status(200).json({ message: "Success!", success: true });
};

export const getHistories: RequestHandler = async (req, res): Promise<any> => {
  const { limit = "10", pageNo = "0" } = req.query as PaginationQuery;
  const histories = await History.aggregate([
    { $match: { owner: req.user.id } },
    {
      $project: {
        all: {
          $slice: ["$all", parseInt(limit) * parseInt(pageNo), parseInt(limit)],
        },
      },
    },
    { $unwind: "$all" },
    {
      $lookup: {
        from: "audios",
        localField: "all.audio",
        foreignField: "_id",
        as: "audioInfo",
      },
    },
    { $unwind: "$audioInfo" },
    {
      $project: {
        _id: 0,
        id: "$all._id",
        audioId: "$audioInfo._id",
        date: "$all.date",
        title: "$audioInfo.title",
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$date" },
        },
        audios: { $push: "$$ROOT" },
      },
    },
    {
      $project: {
        _id: 0,
        id: "$id",
        date: "$_id",
        audios: "$$ROOT.audios",
      },
    },
    {
      $sort: { date: -1 },
    },
  ]);

  return res.status(200).json({histories});
};
