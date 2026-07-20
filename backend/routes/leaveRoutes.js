import express from "express";
import Leave from "../models/Leave.js";
import User from "../models/User.js";

const router = express.Router();

// Student: apply for leave
router.post("/", async (req, res) => {
  try {
    const { studentId, reason, startDate, endDate } = req.body;

    if (!studentId || !reason || !startDate || !endDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    // Check for overlapping pending/approved leaves
    const overlap = await Leave.findOne({
      student: studentId,
      status: { $in: ["pending", "approved"] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });
    if (overlap) {
      return res.status(400).json({ message: "You already have a leave request for this period" });
    }

    const leave = await Leave.create({
      student: studentId,
      reason,
      startDate: start,
      endDate: end,
    });

    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// Student: get my leaves
router.get("/student/:studentId", async (req, res) => {
  try {
    const leaves = await Leave.find({ student: req.params.studentId })
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// Admin: get all leaves
router.get("/", async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate("student", "username email")
      .populate("reviewedBy", "username")
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// Admin: approve or decline leave
router.put("/:id", async (req, res) => {
  try {
    const { status, reviewedBy } = req.body;

    if (!["approved", "declined"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'declined'" });
    }

    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status, reviewedBy, reviewedAt: new Date() },
      { new: true }
    ).populate("student", "username email");

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// Student: cancel a pending leave
router.delete("/:id/:studentId", async (req, res) => {
  try {
    const leave = await Leave.findOne({
      _id: req.params.id,
      student: req.params.studentId,
      status: "pending"
    });

    if (!leave) {
      return res.status(404).json({ message: "Pending leave not found" });
    }

    await Leave.findByIdAndDelete(req.params.id);
    res.json({ message: "Leave cancelled" });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

export default router;
