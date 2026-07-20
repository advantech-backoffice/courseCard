import express from 'express';
import Course from '../models/Courses.js';
import multer from 'multer';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Use memory storage for uploads to avoid read-only file system errors on serverless environments like Vercel
const upload = multer({ storage: multer.memoryStorage() });

// Excel Upload Route
router.post('/upload-excel', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "Please upload a file" });
    }

    let workbook;
    if (file.path) {
      // Disk storage: read from file path
      workbook = xlsx.readFile(file.path);
    } else if (file.buffer) {
      // Memory storage: read from buffer
      workbook = xlsx.read(file.buffer, { type: 'buffer' });
    } else {
      return res.status(400).json({ message: "Invalid file format" });
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Flexible column mapping
    const coursesMap = {};

    data.forEach(row => {
      // Support both Title/Module/Topic and course_name/module_name/module_content
      const name = row.course_name || row.Title;
      const desc = row.course_description || row.Description || "";
      const modName = row.module_name || row.Module;
      const content = row.module_content || row.Topic;
      const months = row.Months || row.Duration || 1;

      if (!name || !modName) return;

      if (!coursesMap[name]) {
        const endDate = new Date();
        const numMonths = parseInt(months) || 1;
        endDate.setMonth(endDate.getMonth() + numMonths);

        coursesMap[name] = {
          course_name: name,
          course_description: desc,
          modules: [],
          total_duration: `${numMonths} Month${numMonths > 1 ? 's' : ''}`,
          endDate: endDate
        };
      }

      let moduleEntry = coursesMap[name].modules.find(m => m.module_name === modName);
      if (!moduleEntry) {
        moduleEntry = { module_name: modName, module_content: [] };
        coursesMap[name].modules.push(moduleEntry);
      }

      if (content) {
        // Handle comma-separated topics or single topic per row
        const topics = String(content).split(/[;,]+/).map(t => t.trim()).filter(Boolean);
        for (const t of topics) {
          // Avoid duplicates by name
          if (!moduleEntry.module_content.some(existing => (typeof existing === "string" ? existing : existing.name) === t)) {
            moduleEntry.module_content.push({ name: t, assignmentLink: "" });
          }
        }
      }
    });

    const coursesToInsert = Object.values(coursesMap);
    
    // Remove duplicates within module_content
    coursesToInsert.forEach(course => {
      course.modules.forEach(mod => {
        const seen = new Set();
        mod.module_content = mod.module_content.filter(t => {
          const name = typeof t === "string" ? t : t.name;
          if (seen.has(name)) return false;
          seen.add(name);
          return true;
        });
      });
    });

    await Course.insertMany(coursesToInsert);

    // Clean up uploaded file (only if using disk storage)
    if (file.path) {
      fs.unlinkSync(file.path);
    }

    res.json({ message: "Courses uploaded successfully", count: coursesToInsert.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// Course routes
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/add', async (req, res) => {
    const course = new Course(req.body);
    try {
        const newCourse = await course.save();
        res.status(201).json(newCourse);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.post('/bulk', async (req, res) => {
  try {
    const courses = req.body;

    if (!Array.isArray(courses)) {
      return res.status(400).json({ message: "Invalid data format" });
    }

    await Course.insertMany(courses);

    res.json({
      message: "Courses imported successfully",
      count: courses.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Bulk insert failed",
      error: err.message
    });
  }
});

router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        res.json(course);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Helper function to update student progress after a course change
const updateCourseProgress = async (course) => {
  const totalTopics = course.modules.reduce((acc, mod) => acc + (mod.module_content ? mod.module_content.length : 0), 0);
  const users = await User.find({ "progress.courseId": course._id });
  for (let user of users) {
    let progressEntry = user.progress.find(p => p.courseId.toString() === course._id.toString());
    // Only update students who haven't completed the course yet
    if (progressEntry && progressEntry.progressPercentage !== 100 && !progressEntry.examCompleted) {
      progressEntry.progressPercentage = totalTopics ? Math.round((progressEntry.completedTopics.length / totalTopics) * 1000) / 10 : 0;
      if (progressEntry.progressPercentage > 100) progressEntry.progressPercentage = 100; // Cap at 100
      await user.save();
    }
  }
};

router.put('/:id', async (req, res) => {
  try {
    const { course_name, course_description, modules, total_duration, endDate } = req.body;

    let normalizedModules = modules;
    if (modules) {
      normalizedModules = modules.map(mod => ({
        module_name: mod.module_name,
        module_content: Course.normalizeTopics(mod.module_content)
      }));
    }

    const updateData = {};
    if (course_name !== undefined) updateData.course_name = course_name;
    if (course_description !== undefined) updateData.course_description = course_description;
    if (normalizedModules !== undefined) updateData.modules = normalizedModules;
    if (total_duration !== undefined) updateData.total_duration = total_duration;
    if (endDate !== undefined) updateData.endDate = endDate;

    console.log("PUT updateData:", JSON.stringify(updateData, null, 2));

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    await updateCourseProgress(updatedCourse);
    res.json(updatedCourse);

  } catch (error) {
    console.error("PUT /:id full error:", error.stack || error);
    res.status(500).json({
      message: "Update failed",
      error: error.message
    });
  }
});

router.delete('/:id', async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        res.json({ message: 'Course deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Course module routes
router.put('/:id/modules', async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, { modules: req.body }, { new: true });
        if (!course) return res.status(404).json({ message: 'Course not found' });
        await updateCourseProgress(course);
        res.json(course);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/:id/modules/:moduleId', async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, { $pull: { modules: { _id: req.params.moduleId } } }, { new: true });
        if (!course) return res.status(404).json({ message: 'Course not found' });
        await updateCourseProgress(course);
        res.json(course);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.get('/teacher/:teacherId', async (req, res) => {
    try {
        // Since we already have the assignedCourses in the User model
        const user = await User.findById(req.params.teacherId).populate('assignedCourses');
        res.json(user ? user.assignedCourses : []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
