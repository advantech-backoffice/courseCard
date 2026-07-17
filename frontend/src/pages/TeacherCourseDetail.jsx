import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, CheckCircle, Users } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { useAuth } from '../context/AuthContext';

export default function TeacherCourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [courseRes, studentsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/courses/${id}`),
          fetch(`${API_BASE_URL}/users/teacher/${user._id}/students`),
        ]);

        if (!courseRes.ok) throw new Error('Course not found');
        const courseData = await courseRes.json();
        setCourse(courseData);

        const studentsData = await studentsRes.json();

        const enriched = studentsData.map(student => {
          const progress = student.progress?.find(p => p.courseId === id);
          const completed = progress?.completedTopics?.length || 0;
          const totalTopics = courseData.modules?.reduce((acc, m) => acc + m.module_content.length, 0) || 1;
          const progressPercent = Math.round((completed / totalTopics) * 100);

          return {
            ...student,
            completed,
            totalTopics,
            progressPercent,
            isCompleted: progressPercent === 100,
          };
        });

        setStudents(enriched);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (user) loadData();
  }, [id, user]);

  if (loading) return <div className="animate-pulse h-64 bg-zinc-200 rounded-3xl" />;

  if (error) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        <div className="text-center py-20">
          <p className="text-zinc-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </button>

      <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
        <h1 className="text-3xl font-bold text-white mb-2">{course.course_name}</h1>
        <p className="text-zinc-400">{course.course_description}</p>
        {course.total_duration && (
          <div className="flex items-center text-sm text-zinc-500 mt-2">
            <Clock className="w-4 h-4 mr-1.5" /> {course.total_duration}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-zinc-400" />
        <h2 className="text-xl font-bold">Enrolled Students ({students.length})</h2>
      </div>

      <div className="space-y-4">
        {students.length === 0 ? (
          <p className="text-zinc-500">No students enrolled in this course.</p>
        ) : (
          students.map(student => (
            <div key={student._id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">{student.username}</p>
                  <p className="text-sm text-zinc-500">{student.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-medium">{student.completed}/{student.totalTopics} topics</p>
                  <p className="text-xs text-zinc-500">{student.progressPercent}%</p>
                </div>

                <div className="w-32">
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${student.isCompleted ? 'bg-emerald-500' : 'bg-blue-600'}`}
                      style={{ width: `${student.progressPercent}%` }}
                    />
                  </div>
                </div>

                {student.isCompleted ? (
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 text-xs font-bold rounded-full flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" /> Done
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-bold rounded-full">
                    In Progress
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
