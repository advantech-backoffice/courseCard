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

router.get('/daily-report', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const present = [];
    const absent = [];

    for (const student of students) {
      let todayActivity = null;

      for (const prog of student.progress) {
        for (const topic of prog.completedTopics) {
          if (topic.completedAt >= todayStart && topic.completedAt <= todayEnd) {
            todayActivity = {
              topicKey: topic.topicKey,
              activityType: topic.activityType || "lecture",
              completedAt: topic.completedAt
            };
            break;
          }
        }
        if (todayActivity) break;
      }

      if (todayActivity) {
        present.push({
          _id: student._id,
          username: student.username,
          email: student.email,
          topicKey: todayActivity.topicKey,
          activityType: todayActivity.activityType,
          completedAt: todayActivity.completedAt
        });
      } else {
        absent.push({
          _id: student._id,
          username: student.username,
          email: student.email
        });
      }
    }

    res.json({
      success: true,
      data: {
        date: todayStart.toISOString().split('T')[0],
        presentCount: present.length,
        absentCount: absent.length,
        present,
        absent
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Report 2: Today's full activity (all topic completions today)
router.get('/today-activity', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    const courses = await Course.find();
    const courseMap = {};
    courses.forEach(c => { courseMap[c._id.toString()] = c.course_name; });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const activities = [];

    for (const student of students) {
      for (const prog of student.progress) {
        for (const topic of prog.completedTopics) {
          if (topic.completedAt >= todayStart && topic.completedAt <= todayEnd) {
            activities.push({
              username: student.username,
              email: student.email,
              course: courseMap[prog.courseId.toString()] || "Unknown",
              topic: topic.topicKey,
              activityType: topic.activityType || "lecture",
              completedAt: topic.completedAt
            });
          }
        }
      }
    }

    activities.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    res.json({
      success: true,
      data: {
        date: todayStart.toISOString().split('T')[0],
        count: activities.length,
        activities
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Report 3: Faculty-wise student daily record
router.get('/faculty-daily', async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('-password');
    const students = await User.find({ role: 'student' }).select('-password');
    const courses = await Course.find();
    const courseMap = {};
    courses.forEach(c => { courseMap[c._id.toString()] = c.course_name; });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const studentMap = {};
    students.forEach(s => { studentMap[s._id.toString()] = s; });

    const facultyData = [];

    for (const teacher of teachers) {
      const studentRecords = [];

      for (const sId of teacher.assignedStudents) {
        const student = studentMap[sId.toString()];
        if (!student) continue;

        let todayActivity = null;
        for (const prog of student.progress) {
          for (const topic of prog.completedTopics) {
            if (topic.completedAt >= todayStart && topic.completedAt <= todayEnd) {
              todayActivity = {
                course: courseMap[prog.courseId.toString()] || "Unknown",
                topic: topic.topicKey,
                activityType: topic.activityType || "lecture",
                completedAt: topic.completedAt
              };
              break;
            }
          }
          if (todayActivity) break;
        }

        studentRecords.push({
          username: student.username,
          email: student.email,
          status: todayActivity ? "Present" : "Absent",
          course: todayActivity?.course || "-",
          topic: todayActivity?.topic || "-",
          activityType: todayActivity?.activityType || "-",
          completedAt: todayActivity?.completedAt || null
        });
      }

      facultyData.push({
        teacherId: teacher._id,
        teacherName: teacher.username,
        totalStudents: studentRecords.length,
        presentCount: studentRecords.filter(s => s.status === "Present").length,
        absentCount: studentRecords.filter(s => s.status === "Absent").length,
        students: studentRecords
      });
    }

    res.json({
      success: true,
      data: {
        date: todayStart.toISOString().split('T')[0],
        faculty: facultyData
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Report 4: Student overall activity report
router.get('/student-overall-activity', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    const courses = await Course.find();
    const courseMap = {};
    courses.forEach(c => { courseMap[c._id.toString()] = c.course_name; });

    const studentData = [];

    for (const student of students) {
      const activities = [];

      for (const prog of student.progress) {
        const courseName = courseMap[prog.courseId.toString()] || "Unknown";
        for (const topic of prog.completedTopics) {
          activities.push({
            course: courseName,
            topic: topic.topicKey,
            activityType: topic.activityType || "lecture",
            completedAt: topic.completedAt
          });
        }
      }

      activities.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

      studentData.push({
        username: student.username,
        email: student.email,
        totalActivities: activities.length,
        activities
      });
    }

    studentData.sort((a, b) => b.totalActivities - a.totalActivities);

    res.json({
      success: true,
      data: studentData
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;