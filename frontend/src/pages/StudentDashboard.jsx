import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../constants";

export default function StudentDashboard() {
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [userData, setUserData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetch(`${API_BASE_URL}/users/student/${user._id}`)
        .then((res) => res.json())
        .then((data) => {
          setCourses(data.courseData);
          setUserData(data.studentData);
          let courseProgress = data.studentData.progress.find(
            (p) => p.courseId.toString() === data.courseData[0]._id.toString(),
          );
          console.log(data);
          setIsLoading(false);
        });
    }
  }, [user]);

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold">
          Hello, {user?.username.split(" ")[0]}!
        </h2>
        <p className="text-zinc-500 mt-1">
          Ready to continue your learning journey?
        </p>
      </div>

      {/* COURSE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-zinc-200 rounded-3xl animate-pulse"
            ></div>
          ))
        ) : courses.length > 0 ? (
          courses.map((course) => (
            <Link
              key={course._id}
              to={`/student/course/${course._id}`}
              className="group bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              {/* ICON + COMPLETED BADGE */}
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center text-violet-600 group-hover:scale-110 transition">
                  <BookOpen className="w-6 h-6" />
                </div>

                {course.progress === 100 && (
                  <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Completed
                  </div>
                )}
              </div>

              {/* TITLE */}
              <h3 className="text-xl font-bold mb-2 group-hover:text-violet-600 transition">
                {course.course_name}
              </h3>

              {/* DESCRIPTION */}
              <p className="text-sm text-zinc-500 line-clamp-2 mb-6">
                {course.course_description}
              </p>

              {/* PROGRESS BAR */}
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-500">Progress</span>
                  <span>{course.progress || 0}%</span>
                </div>

                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div style={{ width: `${course.progress}%` }} className="bg-indigo-600 h-3 transition-all duration-500" />
                  {course.progress === 100 && <div>Completed</div>}
                </div>
              </div>

              {/* FOOTER */}
              <div className="mt-6 pt-6 border-t flex items-center justify-between">
                <div className="flex items-center text-sm text-zinc-500">
                  <Clock className="w-4 h-4 mr-2" />
                  {course.modules?.length || 0} Modules
                </div>

                <div className="flex items-center text-violet-600 font-semibold text-sm">
                  Continue
                  <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-zinc-400" />
            </div>

            <h3 className="text-xl font-bold mb-2">No courses enrolled</h3>

            <p className="text-zinc-500">
              You haven't been enrolled in any courses yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
