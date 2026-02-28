import jwt from "jsonwebtoken";
import Course from "../models/Courses.js";
import User from "../models/User.js";
import express from "express";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "pokemon";

router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

router.get("/students", async (req, res) => {
  try {
    const students = await User.find({ role: "student" });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

router.get("/teachers", async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" }).select("-password");
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

router.post("/enroll-student", async (req, res) => {
  const { studentId, courseId } = req.body;

  try {
    const student = await User.findById(studentId);

    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }

    // Add course only if not already enrolled
    await User.findByIdAndUpdate(
      studentId,
      { $addToSet: { assignedCourses: courseId } },
      { new: true },
    );

    res.json({ message: "Student enrolled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/assign-student", async (req, res) => {
  const { teacherId, studentId } = req.body;

  try {
    const teacher = await User.findById(teacherId);
    const student = await User.findById(studentId);

    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ message: "Teacher not found" });
    }

    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }

    // Add student to teacher's assignedStudents
    await User.findByIdAndUpdate(
      teacherId,
      { $addToSet: { assignedStudents: studentId } },
      { new: true },
    );

    res.json({ message: "Student assigned to teacher successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark topic completed
router.post('/student/complete-topic', async (req, res) => {
  const { userId, courseId, moduleId, topicName } = req.body;

  try {
    const user = await User.findById(userId);
    const course = await Course.findById(courseId);

    if (!user || user.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Total topics in course
    const totalTopics = course.modules.reduce(
      (acc, mod) => acc + mod.module_content.length,
      0
    );
    // Find progress entry for course
    let progressEntry = user.progress.find(
      p => p.courseId.toString() === courseId
    );

    // If not exists, create new progress entry
    if (!progressEntry) {
      user.progress.push({
        courseId,
        topicComplted: [],
        progressPercentage: 0
      });
      progressEntry = user.progress[user.progress.length - 1];
    }

    const topicKey = `${moduleId}-${topicName}`;

    // Add topic only if not already completed
    if (!progressEntry.topicComplted.includes(topicKey)) {
      progressEntry.topicComplted.push(topicKey);
    }

    // Calculate new percentage
    const completedCount = progressEntry.topicComplted.length;
    progressEntry.progressPercentage = Math.round(
      (completedCount / totalTopics) * 100
    );

    await user.save();

    res.json({
      message: 'Topic marked as completed',
      progress: progressEntry.progressPercentage
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server error: ' + error.message
    });
  }
});

// GET students assigned to a teacher
router.get("/teacher/:id/students", async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id);

    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const students = await User.find({
      _id: { $in: teacher.assignedStudents },
      role: "student",
    }).select("-password");

    res.json(students);
  } catch (error) {
    res.status(500).json({
      message: "Server error: " + error.message,
    });
  }
});

// GET courses of a specific student
router.get("/student/:id/courses", async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }

    const courses = await Course.find({
      _id: { $in: student.assignedCourses },
    });

    res.json(courses);
  } catch (error) {
    res.status(500).json({
      message: "Server error: " + error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// student by id
router.get("/student/:id", async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }

    const courses = await Course.find({
      _id: { $in: student.assignedCourses },
    });

    // Calculate progress for each course
    const coursesWithProgress = courses.map((course) => {
      const progressData = student.progress.find(
        (p) => p.courseId.toString() === course._id.toString()
      );

      const totalTopics = course.modules.reduce(
        (acc, mod) => acc + mod.module_content.length,
        0
      );

      const completedTopics = progressData?.topicComplted?.length || 0;
      const progress = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;
      
      return {
        ...course.toObject(),
        progress,
      };
    });

    res.json({ studentData: student, courseData: coursesWithProgress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/teacher/:id", async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id).select("-password");
    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// Assign course to teacher
router.post("/assign-course", async (req, res) => {
  const { teacherId, courseId } = req.body;
  try {
    await User.findByIdAndUpdate(teacherId, {
      $addToSet: { assignedCourses: courseId },
    });
    res.json({ message: "Course assigned to teacher successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// Enroll student in course
router.post("/enroll-student", async (req, res) => {
  const { studentId, courseId } = req.body;
  try {
    await User.findByIdAndUpdate(studentId, {
      $addToSet: { assignedCourses: courseId },
    });
    res.json({ message: "Student enrolled in course successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

export default router;
