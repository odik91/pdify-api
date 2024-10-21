import { Model, model, models, ObjectId, Schema } from "mongoose";

type HistoryType = {
  audio: ObjectId;
  progress: number;
  date: Date;
};

interface HistoryDocument {
  owner: ObjectId;
  last: HistoryType;
  all: HistoryType[];
}

const histroySchema = new Schema<HistoryDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    last: {
      audio: {
        type: Schema.Types.ObjectId,
        ref: "Audio",
      },
      date: {
        type: Date,
        required: true,
      },
    },
    all: [
      {
        audio: {
          type: Schema.Types.ObjectId,
          ref: "Audio",
        },
        date: {
          type: Date,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const History = models.History || model("History", histroySchema);

export default History as Model<HistoryDocument>;
