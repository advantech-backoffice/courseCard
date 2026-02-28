import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  PlayCircle,
  Clock,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { API_BASE_URL } from "../constants";
import { useAuth } from "../context/AuthContext";

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [userProgress, setUserProgress] = useState([]);
  const [openModule, setOpenModule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ===== LOAD COURSE + PROGRESS FROM DATABASE =====
  useEffect(() => {
    async function loadData() {
      try {
        // 1️⃣ Load course
        const courseRes = await fetch(`${API_BASE_URL}/courses/${id}`);
        const courseData = await courseRes.json();
        setCourse(courseData);

        // 2️⃣ Load user progress
        const userRes = await fetch(`${API_BASE_URL}/users/${user._id}`);
        const userData = await userRes.json();

        const progressData = userData.progress?.find(
          (p) => p.courseId === id
        );

        if (progressData) {
          setUserProgress(progressData.topicComplted || []);          
        } else {
          setUserProgress([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) loadData();
  }, [id, user]);

  // ===== MARK TOPIC COMPLETED =====
  const markTopicCompleted = async (moduleId, topicName) => {
    const topicKey = `${moduleId}-${topicName}`;

    if (userProgress.includes(topicKey)) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/users/student/complete-topic`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user._id,
            courseId: id,
            moduleId,
            topicName,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to update progress");

      // Update UI immediately
      setUserProgress((prev) => [...prev, topicKey]);
    } catch (err) {
      console.error(err);
    }
  };

  // ===== LOADING UI =====
  if (isLoading)
    return <div className="animate-pulse h-64 bg-zinc-200 rounded-3xl" />;

  if (!course) return <div>Course not found</div>;

  // ===== CALCULATE PROGRESS =====
  const totalTopics = course.modules.reduce(
    (acc, mod) => acc + mod.module_content.length,
    0
  );

  const progress = Math.round(
    (userProgress.length / totalTopics) * 100
  );

  return (
    <div className="space-y-8">

      {/* ===== BACK BUTTON ===== */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>

      {/* ===== COURSE HEADER ===== */}
      <div className="bg-zinc-900 rounded-3xl border p-8 shadow-sm space-y-4">

        <h1 className="text-4xl font-bold">{course.course_name}</h1>

        <p className="text-zinc-500">{course.course_description}</p>

        {/* ===== PROGRESS BAR ===== */}
        <div>
          <div className="flex justify-between mb-2 text-sm font-medium">
            <span>Course Progress</span>
            <span>{progress}%</span>
          </div>

          <div className="w-full bg-zinc-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-3 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* ===== MODULE LIST ===== */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold px-2">Course Modules</h2>

        {course.modules?.map((module) => {
          const isOpen = openModule === module.module_id;

          return (
            <div
              key={module.module_id}
              className="rounded-2xl border bg-zinc-900 overflow-hidden"
            >
              {/* ===== MODULE HEADER ===== */}
              <button
                onClick={() =>
                  setOpenModule(isOpen ? null : module.module_id)
                }
                className="w-full flex items-center justify-between p-5 bg-zinc-900"
              >
                <div className="flex items-center">

                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-4 bg-zinc-100 text-indigo-500">
                    <PlayCircle className="w-5 h-5" />
                  </div>

                  <div className="text-left">
                    <span className="text-xs font-bold text-zinc-400 uppercase">
                      Module {module.module_id}
                    </span>

                    <h4 className="font-bold">
                      {module.module_name}
                    </h4>
                  </div>
                </div>

                <ChevronRight
                  className={`w-5 h-5 transition-transform ${
                    isOpen ? "rotate-90 text-indigo-500" : "text-zinc-400"
                  }`}
                />
              </button>

              {/* ===== TOPICS ===== */}
              {isOpen && (
                <div className="px-8 pb-6 pt-2 border-t bg-zinc-900">
                  <ul className="space-y-2">

                    {module.module_content?.map((topic, index) => {
                      const topicKey = `${module.module_id}-${topic}`;
                      const isCompleted =
                        userProgress.includes(topicKey);
                      return (
                        <li
                          key={index}
                          onClick={() =>
                            markTopicCompleted(
                              module.module_id,
                              topic
                            )
                          }
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition
                          ${
                            isCompleted
                              ? "bg-green-50 text-green-600"
                              : ""
                          }`}
                        >
                          <span className="flex items-center">

                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4 mr-3 text-green-500" />
                            ) : (
                              <span className="mr-3 w-2 h-2 rounded-full bg-indigo-400" />
                            )}

                            {topic}
                          </span>

                          {isCompleted ? (
                            <span className="text-xs font-semibold">
                              Completed
                            </span>
                          ) : (
                            <Clock className="w-4 h-4 text-zinc-400" />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}