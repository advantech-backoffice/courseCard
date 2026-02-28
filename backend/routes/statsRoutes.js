import express from 'express'
import User from '../models/User.js'  
import Course from '../models/Courses.js';


const router = express.Router();
router.get('/', async (req, res) => {
    try {
        const [totalTeachers, totalStudents, totalCourses] = await Promise.all([
            User.countDocuments({ role: 'teacher' }),
            User.countDocuments({ role: 'student' }),
            Course.countDocuments()
        ]);

        res.status(200).json({
            success: true,
            data: {
                users : totalTeachers + totalStudents,
                teachers: totalTeachers,
                students: totalStudents,
                courses: totalCourses
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

router.get('/popular-courses', async (req, res) => {
  try {
    const popularCourses = await Course.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'assignedCourses',
          as: 'students'
        }
      },
      {
        $addFields: {
          enrollmentCount: { $size: '$students' }
        }
      },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 5 },
      {
        $project: {
          course_name: 1,
          course_description: 1,
          enrollmentCount: 1
        }
      }
    ]);

    res.json({ success: true, data: popularCourses });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/recent-signups', async (req, res) => {
  try {
    const recentUsers = await User.find()
      .sort({ createdAt: -1 }) // newest first
      .limit(5)
      .select('-password'); // hide password

    res.status(200).json({
      success: true,
      data: recentUsers
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent signups',
      error: error.message
    });
  }
});

router.get('/enrollment-trend', async (req, res) => {
  try {
    const trend = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $unwind: '$assignedCourses'
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          enrollments: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const formatted = trend.map(item => ({
      year: item._id.year,
      month: item._id.month,
      enrollments: item.enrollments
    }));

    res.json({ success: true, data: formatted });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;