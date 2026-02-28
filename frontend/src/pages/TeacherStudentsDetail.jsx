import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../constants';

export default function TeacherStudentDetail() {
  const { id } = useParams();
  const [courses, setCourses] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openCourse, setOpenCourse] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const studentRes = await fetch(`${API_BASE_URL}/users/student/${id}`);
        const studentData = await studentRes.json();

        setStudent(studentData.studentData);

        setCourses(studentData.courseData);

        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    }

    fetchData();
  }, [id]);

  const isTopicCompleted = (courseId, moduleId, topicName) => {
    const progressData = student?.progress?.find(
      (p) => p.courseId.toString() === courseId.toString()
    );
    if (!progressData) return false;
    return progressData.topicComplted.includes(`${moduleId}-${topicName}`);
  };

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="space-y-8">

      {/* Student Header */}
      <div>
        <h2 className="text-3xl font-bold">{student?.username}</h2>
        <p className="text-zinc-500">{student?.email}</p>
      </div>

      {/* Courses */}
      <div>
        <h3 className="text-xl font-semibold mb-6">
          Enrolled Courses ({courses.length})
        </h3>

        {courses.length > 0 ? (
          <div className="space-y-4">

            {courses.map(course => {
              const isOpen = openCourse === course._id;

              return (
                <div key={course._id} className="rounded-2xl border bg-white dark:bg-zinc-900 overflow-hidden">

                  {/* Course Card */}
                  <button
                    onClick={() => setOpenCourse(isOpen ? null : course._id)}
                    className="w-full flex items-center justify-between p-6"
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 mr-4">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold">{course.course_name}</h4>
                        <p className="text-sm text-zinc-500 line-clamp-1">{course.course_description}</p>
                      </div>
                    </div>

                    <ChevronRight className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </button>

                  {/* Modules & Topics */}
                  {isOpen && (
                    <div className="px-8 pb-6 pt-2 border-t bg-zinc-50 dark:bg-zinc-800">
                      {course.modules?.map((mod) => (
                        <div key={mod.module_id} className="mb-4">
                          <h5 className="font-semibold mb-2">{mod.module_name}</h5>
                          <ul className="space-y-1">
                            {mod.module_content.map((topic, idx) => {
                              const completed = isTopicCompleted(course._id, mod.module_id, topic);
                              return (
                                <li key={idx} className="flex items-center space-x-2">
                                  {completed ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-zinc-400" />
                                  )}
                                  <span className={completed ? "line-through text-zinc-400" : ""}>{topic}</span>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

          </div>
        ) : (
          <p className="text-zinc-500">This student is not enrolled in any course.</p>
        )}

      </div>
    </div>
  );
}