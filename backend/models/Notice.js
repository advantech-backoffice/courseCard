import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  caption: { type: String, default: "" },
  linkUrl: { type: String, default: "" },
  mediaType: { type: String, enum: ["image", "video", "none"], default: "none" },
  mediaUrl: { type: String, default: "" },
  mediaBase64: { type: String, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export default mongoose.model("Notice", noticeSchema);
