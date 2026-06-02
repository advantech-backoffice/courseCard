import express from 'express'
import User from '../models/User.js'  
import Course from '../models/Courses.js';
import xlsx from 'xlsx';


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

router.get('/exam-status', async (req, res) => {
  try {
    const students = await User.find({
      role: 'student',
      'progress.progressPercentage': 100
    }).populate('progress.courseId', 'course_name');

    let pendingExams = [];
    let completedExams = [];

    students.forEach(student => {
      student.progress.forEach(p => {
        if (p.progressPercentage === 100 && p.courseId) {
          const examData = {
            userId: student._id,
            username: student.username,
            email: student.email,
            courseId: p.courseId._id,
            course_name: p.courseId.course_name,
            completedAt: p.completedTopics[p.completedTopics.length - 1]?.completedAt || new Date(),
            examCompletedAt: p.examCompletedAt
          };
          if (p.examCompleted) {
            completedExams.push(examData);
          } else {
            pendingExams.push(examData);
          }
        }
      });
    });

    res.json({ success: true, pendingExams, completedExams });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/mark-exam-done', async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    const user = await User.findOneAndUpdate(
      { _id: userId, 'progress.courseId': courseId },
      { 
        $set: { 
          'progress.$.examCompleted': true,
          'progress.$.examCompletedAt': new Date()
        } 
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User or progress entry not found' });
    }

    res.json({ success: true, message: 'Exam marked as done' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/pending-exams/export', async (req, res) => {
  try {
    const students = await User.find({
      role: 'student',
      'progress.progressPercentage': 100
    }).populate('progress.courseId', 'course_name endDate');

    const exportData = [];

    students.forEach(student => {
      student.progress.forEach(p => {
        if (p.progressPercentage === 100 && p.courseId && !p.examCompleted) {
          // Find the earliest completion date as the pseudo start date
          let startDate = p.startedAt || student.createdAt;
          if (p.completedTopics && p.completedTopics.length > 0) {
            startDate = p.completedTopics[0].completedAt;
          }
          
          exportData.push({
            'Name': student.username,
            'Date of Course Started': new Date(startDate).toLocaleDateString(),
            'Date of Course End': new Date(p.courseId.endDate).toLocaleDateString(),
            'Subject': p.courseId.course_name
          });
        }
      });
    });

    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Pending Exams");
    
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="pending_exams.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;