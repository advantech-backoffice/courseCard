import express from 'express';
import Course from '../models/Courses.js';
import multer from 'multer';
import xlsx from 'xlsx';
import fs from 'fs';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Excel Upload Route
router.post('/upload-excel', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "Please upload a file" });
    }

    const workbook = xlsx.readFile(file.path);
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
        moduleEntry.module_content.push(...topics);
      }
    });

    const coursesToInsert = Object.values(coursesMap);
    
    // Remove duplicates within module_content
    coursesToInsert.forEach(course => {
      course.modules.forEach(mod => {
        mod.module_content = [...new Set(mod.module_content)];
      });
    });

    await Course.insertMany(coursesToInsert);

    // Clean up uploaded file
    fs.unlinkSync(file.path);

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

router.put('/:id', async (req, res) => {
  try {
    const courseId = Number(req.params.id);

    const updatedCourse = await Course.findOneAndUpdate(
      { course_id: courseId },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedCourse) {
      return res.status(404).json({
        message: "Course not found"
      });
    }

    res.json(updatedCourse);

  } catch (error) {
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
        res.json(course);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/:id/modules/:moduleId', async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, { $pull: { modules: { _id: req.params.moduleId } } }, { new: true });
        if (!course) return res.status(404).json({ message: 'Course not found' });
        res.json(course);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.get('/teacher/:teacherId', async (req, res) => {
    try {
        // Since we already have the assignedCourses in the User model
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(req.params.teacherId).populate('assignedCourses');
        res.json(user ? user.assignedCourses : []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
