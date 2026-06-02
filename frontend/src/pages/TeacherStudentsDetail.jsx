import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle, ChevronRight, AlertCircle } from 'lucide-react';
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

  const getTopicStatus = (courseId, moduleId, topicName) => {
    const progressData = student?.progress?.find(
      (p) => p.courseId.toString() === courseId.toString()
    );
    if (!progressData) return null;
    const topicKey = `${moduleId}-${topicName}`;
    return progressData.completedTopics?.find(t => t.topicKey === topicKey) || null;
  };

  const handleStartCourse = async (courseId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/student/${id}/course/${courseId}/start`, {
        method: 'POST'
      });
      if (response.ok) {
        // Refetch data
        const studentRes = await fetch(`${API_BASE_URL}/users/student/${id}`);
        const studentData = await studentRes.json();
        setStudent(studentData.studentData);
        setCourses(studentData.courseData);
      }
    } catch (error) {
      console.error(error);
    }
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
                  <div
                    onClick={() => setOpenCourse(isOpen ? null : course._id)}
                    className="w-full flex items-center justify-between p-6 cursor-pointer text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 mr-4">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-lg font-bold">{course.course_name}</h4>
                        <div className="flex items-center gap-3">
                          <p className="text-sm text-zinc-500 line-clamp-1">{course.course_description}</p>
                          {course.total_duration && (
                            <span className="text-xs font-medium text-zinc-400 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {course.total_duration}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {!course.startedAt ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartCourse(course._id);
                          }}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow transition-colors"
                        >
                          Start Course
                        </button>
                      ) : (
                        <div className="text-xs font-medium text-zinc-500 mr-2 flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1 text-emerald-500" />
                          Started: {new Date(course.startedAt).toLocaleDateString()}
                        </div>
                      )}
                      {course.isOverdue && (
                        <div className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-[10px] font-bold flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          LATE
                        </div>
                      )}
                      {course.progress < 100 && !course.isOverdue && (
                        <div className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-bold flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          ON TIME
                        </div>
                      )}
                      {course.progress === 100 && (
                        <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          COMPLETED
                        </div>
                      )}
                      <ChevronRight className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Modules & Topics */}
                  {isOpen && (
                    <div className="px-8 pb-6 pt-2 border-t bg-zinc-50 dark:bg-zinc-800">
                      {course.modules?.map((mod, modIdx) => (
                        <div key={mod.module_name || modIdx} className="mb-4">
                          <h5 className="font-semibold mb-2">{mod.module_name}</h5>
                          <ul className="space-y-1">
                            {mod.module_content.map((topic, idx) => {
                              const topicStatus = getTopicStatus(course._id, mod.module_name, topic);
                              const completed = !!topicStatus;
                              return (
                                <li key={idx} className="flex items-start space-x-2 py-1">
                                  <div className="mt-0.5">
                                    {completed ? (
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <Clock className="w-4 h-4 text-zinc-400" />
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className={completed ? "line-through text-zinc-400" : "text-zinc-700 dark:text-zinc-300"}>
                                      {topic}
                                    </span>
                                    {completed && topicStatus.completedAt && (
                                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-500 mt-0.5">
                                        Completed on {new Date(topicStatus.completedAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
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