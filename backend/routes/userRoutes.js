import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import xlsx from "xlsx";
import Course from "../models/Courses.js";
import User from "../models/User.js";
import express from "express";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "pokemon";
const upload = multer({ storage: multer.memoryStorage() });

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

// Bulk upload students via Excel
router.post("/bulk-upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an Excel file" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (rows.length === 0) {
      return res.status(400).json({ message: "Excel file is empty" });
    }

    let created = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const username = (row.username || row.Username || row.Name || "").toString().trim();
      const email = (row.email || row.Email || "").toString().trim();
      const password = (row.password || row.Password || "").toString().trim();
      const courseNames = (row.course || row.Course || "").toString().split(",").map(s => s.trim()).filter(Boolean);
      const facultyNames = (row.faculty || row.Faculty || "").toString().split(",").map(s => s.trim()).filter(Boolean);
      const role = (row.role || row.Role || "student").toString().trim().toLowerCase();

      if (!username || !email || !password) {
        errors.push(`Row ${i + 2}: Missing username, email, or password`);
        continue;
      }

      // Check for existing username
      const existing = await User.findOne({ username });
      if (existing) {
        skipped++;
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        role,
      });

      // Enroll in courses if provided
      for (const cName of courseNames) {
        const course = await Course.findOne({ course_name: cName });
        if (course) {
          await User.findByIdAndUpdate(newUser._id, {
            $addToSet: { assignedCourses: course._id },
          });
        } else {
          errors.push(`Row ${i + 2}: Course "${cName}" not found`);
        }
      }

      // Assign to teachers (faculty) if provided
      for (const fName of facultyNames) {
        const teacher = await User.findOne({ username: fName, role: "teacher" });
        if (teacher) {
          await User.findByIdAndUpdate(teacher._id, {
            $addToSet: { assignedStudents: newUser._id },
          });
        } else {
          errors.push(`Row ${i + 2}: Teacher "${fName}" not found`);
        }
      }

      created++;
    }

    res.json({
      message: `Upload complete: ${created} created, ${skipped} skipped (duplicates)`,
      created,
      skipped,
      errors,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed: " + error.message });
  }
});

router.post("/enroll-student", async (req, res) => {
  const { studentId, courseId } = req.body;
  const studentIds = Array.isArray(studentId) ? studentId : [studentId];
  const courseIds = Array.isArray(courseId) ? courseId : [courseId];

  try {
    for (const sId of studentIds) {
      const student = await User.findById(sId);
      if (!student || student.role !== "student") continue;

      await User.findByIdAndUpdate(
        sId,
        { $addToSet: { assignedCourses: { $each: courseIds } } }
      );
    }

    res.json({ message: "Student(s) enrolled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/assign-student", async (req, res) => {
  const { teacherId, studentId } = req.body;
  const studentIds = Array.isArray(studentId) ? studentId : [studentId];

  try {
    const teacher = await User.findById(teacherId);

    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Add students to teacher's assignedStudents
    await User.findByIdAndUpdate(
      teacherId,
      { $addToSet: { assignedStudents: { $each: studentIds } } }
    );

    res.json({ message: "Student(s) assigned to teacher successfully" });
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

    if (user.isDiscontinued) {
      return res.status(403).json({ message: 'Student account is discontinued' });
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

    // Block if course is already 100% complete
    if (progressEntry && progressEntry.progressPercentage >= 100) {
      return res.status(403).json({ message: 'Course is already completed. No changes are allowed.' });
    }

    // If not exists, create new progress entry
    if (!progressEntry) {
      user.progress.push({
        courseId,
        completedTopics: [],
        progressPercentage: 0
      });
      progressEntry = user.progress[user.progress.length - 1];
    }

    // Auto-detect activity type: if topic has an assignmentLink → "assignment", else → "lecture"
    let detectedActivityType = "lecture";
    for (const mod of course.modules) {
      if (mod.module_name === moduleId || mod._id?.toString() === moduleId) {
        const topic = mod.module_content.find(t => {
          const name = typeof t === "string" ? t : t.name;
          return name === topicName;
        });
        if (topic && typeof topic === "object" && topic.assignmentLink) {
          detectedActivityType = "assignment";
        }
        break;
      }
    }

    const topicKey = `${moduleId}-${topicName}`;

    // Add topic only if not already completed
    if (!progressEntry.completedTopics.some(t => t.topicKey === topicKey)) {
      progressEntry.completedTopics.push({
        topicKey,
        completedAt: new Date(),
        activityType: detectedActivityType
      });
    }

    // Calculate new percentage
    const completedCount = progressEntry.completedTopics.length;
    progressEntry.progressPercentage = Math.round(
      (completedCount / totalTopics) * 1000
    ) / 10;

    await user.save();

    let topicCompletedAt = new Date();
    const topic = progressEntry.completedTopics.find(t => t.topicKey === topicKey);
    if (topic && topic.completedAt) {
      topicCompletedAt = topic.completedAt;
    }

    res.json({
      message: 'Topic marked as completed',
      progress: progressEntry.progressPercentage,
      completedAt: topicCompletedAt,
      activityType: detectedActivityType
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

    const coursesWithStatus = courses.map(course => {
      const progress = student.progress.find(p => p.courseId.toString() === course._id.toString());
      const isCompleted = progress && progress.progressPercentage === 100;
      const isOverdue = !isCompleted && new Date(course.endDate) < new Date();
      
      return {
        ...course.toObject(),
        isOverdue,
        progress: progress ? progress.progressPercentage : 0
      };
    });

    res.json(coursesWithStatus);
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

      const completedTopicsCount = progressData?.completedTopics?.length || 0;
      const progress = totalTopics ? Math.round((completedTopicsCount / totalTopics) * 1000) / 10 : 0;
      
      const isOverdue = progress < 100 && new Date(course.endDate) < new Date();

      return {
        ...course.toObject(),
        progress,
        isOverdue,
        completedTopics: progressData?.completedTopics || [],
        startedAt: progressData?.startedAt
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

router.post("/student/:id/course/:courseId/start", async (req, res) => {
  try {
    const { id, courseId } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Student not found" });

    const progress = user.progress.find((p) => p.courseId.toString() === courseId);
    if (!progress) {
      return res.status(404).json({ message: "Course not found in student progress" });
    }

    if (progress.startedAt) {
      return res.status(400).json({ message: "Course already started" });
    }

    progress.startedAt = new Date();
    await user.save();

    res.json({ message: "Course started successfully", startedAt: progress.startedAt });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// Admin: mark entire course as complete for selected students
router.post("/complete-course", async (req, res) => {
  try {
    const { studentIds, courseId } = req.body;

    if (!studentIds?.length || !courseId) {
      return res.status(400).json({ message: "studentIds and courseId are required" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    let updated = 0;
    for (const sid of studentIds) {
      const student = await User.findById(sid);
      if (!student || student.role !== "student") continue;
      if (student.isDiscontinued) continue;

      const allTopics = [];
      for (const mod of course.modules) {
        for (const topic of mod.module_content) {
          const topicName = typeof topic === "string" ? topic : topic.name;
          allTopics.push({
            topicKey: `${mod.module_name}-${topicName}`,
            completedAt: new Date(),
            activityType: (typeof topic === "object" && topic.assignmentLink) ? "assignment" : "lecture"
          });
        }
      }

      let progressEntry = student.progress.find(
        (p) => p.courseId.toString() === courseId
      );

      if (!progressEntry) {
        student.progress.push({
          courseId,
          completedTopics: allTopics,
          progressPercentage: 100,
          examCompleted: true,
          examCompletedAt: new Date(),
          startedAt: new Date()
        });
      } else {
        const existingKeys = new Set(
          progressEntry.completedTopics.map((t) => t.topicKey)
        );
        for (const t of allTopics) {
          if (!existingKeys.has(t.topicKey)) {
            progressEntry.completedTopics.push(t);
          }
        }
        progressEntry.progressPercentage = 100;
        progressEntry.examCompleted = true;
        if (!progressEntry.examCompletedAt) progressEntry.examCompletedAt = new Date();
        if (!progressEntry.startedAt) progressEntry.startedAt = new Date();
      }

      await student.save();
      updated++;
    }

    res.json({ message: `Course marked complete for ${updated} student(s)`, updated });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// Admin: toggle discontinued status
router.put("/:id/discontinued", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isDiscontinued = !user.isDiscontinued;
    if (user.isDiscontinued) {
      user.discontinuationReason = req.body.reason || "";
    } else {
      user.discontinuationReason = "";
    }
    await user.save();

    res.json({
      message: user.isDiscontinued ? "Student discontinued" : "Student reactivated",
      isDiscontinued: user.isDiscontinued,
      discontinuationReason: user.discontinuationReason,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

export default router;
