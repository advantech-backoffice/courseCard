import express from "express";
import Notice from "../models/Notice.js";
import User from "../models/User.js";

const router = express.Router();

// Admin: create notice
router.post("/", async (req, res) => {
  try {
    const { title, caption, linkUrl, mediaType, mediaUrl, mediaBase64, createdBy } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const notice = await Notice.create({
      title,
      caption: caption || "",
      linkUrl: linkUrl || "",
      mediaType: mediaType || "none",
      mediaUrl: mediaUrl || "",
      mediaBase64: mediaBase64 || "",
      createdBy: createdBy || null
    });

    res.status(201).json(notice);
  } catch (error) {
    console.error("POST /notices error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: get all notices
router.get("/admin", async (req, res) => {
  try {
    const notices = await Notice.find()
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Student: get all notices (newest first)
router.get("/student", async (req, res) => {
  try {
    const notices = await Notice.find()
      .sort({ createdAt: -1 })
      .select("-createdBy");
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Student: get single notice with media
router.get("/student/:id", async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id)
      .select("-createdBy");
    if (!notice) return res.status(404).json({ message: "Notice not found" });
    res.json(notice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: update notice
router.put("/:id", async (req, res) => {
  try {
    const { title, caption, linkUrl, mediaType, mediaUrl, mediaBase64 } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (caption !== undefined) updateData.caption = caption;
    if (linkUrl !== undefined) updateData.linkUrl = linkUrl;
    if (mediaType !== undefined) updateData.mediaType = mediaType;
    if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl;
    if (mediaBase64 !== undefined) updateData.mediaBase64 = mediaBase64;

    const notice = await Notice.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!notice) return res.status(404).json({ message: "Notice not found" });
    res.json(notice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: delete notice
router.delete("/:id", async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) return res.status(404).json({ message: "Notice not found" });
    res.json({ message: "Notice deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
