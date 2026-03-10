import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPost extends Document {
  ownerId: Types.ObjectId;
  title: string;
  content: string;
  imageAttachmentUrl?: string;
  location: string;
  likes: Types.ObjectId[];
  createdAt: Date;
}

const postSchema = new Schema<IPost>({
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  imageAttachmentUrl: {
    type: String,
    required: false,
  },
  location: {
    type: String,
    default: "Unknown Location",
  },
  likes: {
    type: [Schema.Types.ObjectId],
    ref: "User",
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IPost>("Post", postSchema);