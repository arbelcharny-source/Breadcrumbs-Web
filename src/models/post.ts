import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPost extends Document {
  ownerId: Types.ObjectId;
  title: string;
  content: string;
  imageAttachmentUrl?: string;
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IPost>("Post", postSchema);