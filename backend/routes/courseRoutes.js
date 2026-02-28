import express from 'express';
import Course from '../models/Courses.js';

const router = express.Router();

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
