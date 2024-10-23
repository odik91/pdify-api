import Audio from "#/models/audio";
import AutoGeneratedPlaylist from "#/models/autoGeneratedPlaylist";
import cron from "node-cron";

// the 5 fields in the cron syntax represent (in order) minutes, hours, day of the month, and day of the week.

// cron.schedule("*/2 * * * * *", () => {
//   console.log("Cron job is running");
// });

const generatedPlaylist = async (): Promise<any> => {
  const result = await Audio.aggregate([
    { $sort: { likes: -1 } },
    {
      $group: {
        _id: "$category",
        audios: { $push: "$$ROOT._id" },
      },
    },
    { $limit: 20 },
  ]);

  result.map(async (item) => {
    await AutoGeneratedPlaylist.updateOne(
      { title: item._id },
      { $set: { items: item.audios } },
      { upsert: true }
    );
  });
  console.log(result);
};

cron.schedule("0 0 * * *", async () => {
  // this will run on every 24 hours
  await generatedPlaylist();
});
