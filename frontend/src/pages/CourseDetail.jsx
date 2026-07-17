import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  PlayCircle,
  Clock,
  ChevronRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { API_BASE_URL } from "../constants";
import { useAuth } from "../context/AuthContext";

export default function CourseDetail() {
  const { id } = useParams();
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [userProgress, setUserProgress] = useState([]);
  const [openModule, setOpenModule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activityModal, setActivityModal] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState("lecture");

  // ===== LOAD COURSE + PROGRESS FROM DATABASE =====
  useEffect(() => {
    async function loadData() {
      try {
        const courseRes = await fetch(`${API_BASE_URL}/courses/${id}`);
        const courseData = await courseRes.json();
        setCourse(courseData);

        const userRes = await authFetch(`${API_BASE_URL}/users/${user._id}`);
        const userData = await userRes.json();

        const progressData = userData.progress?.find(
          (p) => p.courseId === id
        );

        if (progressData) {
          setUserProgress(progressData.completedTopics || []);          
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
  const markTopicCompleted = async (moduleId, topicName, activityType) => {
    const topicKey = `${moduleId}-${topicName}`;

    if (userProgress.some(t => t.topicKey === topicKey)) return;

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
            activityType,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to update progress");
      const data = await res.json();

      // Update UI immediately
      setUserProgress((prev) => [...prev, { topicKey, completedAt: data.completedAt, activityType }]);
    } catch (err) {
      console.error(err);
    }
  };

  // ===== OPEN ACTIVITY MODAL =====
  const openActivitySelector = (moduleId, topicName) => {
    const topicKey = `${moduleId}-${topicName}`;
    if (userProgress.some(t => t.topicKey === topicKey)) return;
    setActivityModal({ moduleId, topicName });
    setSelectedActivity("lecture");
  };

  const confirmActivity = () => {
    if (activityModal) {
      markTopicCompleted(activityModal.moduleId, activityModal.topicName, selectedActivity);
      setActivityModal(null);
    }
  };

  // ===== LOADING UI =====
  if (isLoading)
    return <div className="animate-pulse h-64 bg-zinc-200 rounded-3xl" />;

  if (!course) return (
    <div className="space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-zinc-400" />
        </div>
        <h3 className="text-xl font-bold mb-2">Course not found</h3>
        <p className="text-zinc-500">This course may have been removed or is unavailable.</p>
      </div>
    </div>
  );

  // ===== CALCULATE PROGRESS =====
  const totalTopics = course.modules.reduce(
    (acc, mod) => acc + mod.module_content.length,
    0
  );

  const progress = Math.round(
    (userProgress.length / totalTopics) * 100
  );

  const isOverdue = progress < 100 && new Date(course.endDate) < new Date();
  const isOnTime = progress < 100 && new Date(course.endDate) >= new Date();
  const isCompleted = progress === 100;

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
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8 shadow-sm space-y-4">

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{course.course_name}</h1>
            {course.total_duration && (
              <div className="flex items-center text-sm font-medium text-zinc-400">
                <Clock className="w-4 h-4 mr-1.5" />
                Duration: {course.total_duration}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {isOverdue && (
              <div className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-1.5 rounded-full text-xs font-bold flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                LATE / OVERDUE
              </div>
            )}
            {isOnTime && (
              <div className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-bold flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                ON TIME
              </div>
            )}
            {isCompleted && (
              <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-1.5 rounded-full text-xs font-bold flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                COMPLETED
              </div>
            )}
          </div>
        </div>

        <p className="text-zinc-500">{course.course_description}</p>

        {/* ===== PROGRESS BAR ===== */}
        <div>
          <div className="flex justify-between mb-2 text-sm font-medium">
            <span className="text-zinc-400">Course Progress</span>
            <span className="text-white">{progress}%</span>
          </div>

          <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-blue-600 h-3 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* ===== MODULE LIST ===== */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold px-2">Course Modules</h2>

        {course.modules?.map((module, index) => {
          const moduleId = module.module_name || index;
          const isOpen = openModule === moduleId;

          return (
            <div
              key={index}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden"
            >
              {/* ===== MODULE HEADER ===== */}
              <button
                onClick={() =>
                  setOpenModule(isOpen ? null : moduleId)
                }
                className="w-full flex items-center justify-between p-5 bg-zinc-900 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center">

                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-4 bg-zinc-800 text-blue-500">
                    <PlayCircle className="w-5 h-5" />
                  </div>

                  <div className="text-left">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      Module {index + 1}
                    </span>

                    <h4 className="font-bold text-white">
                      {module.module_name}
                    </h4>
                  </div>
                </div>

                <ChevronRight
                  className={`w-5 h-5 transition-transform ${
                    isOpen ? "rotate-90 text-blue-500" : "text-zinc-500"
                  }`}
                />
              </button>

              {/* ===== TOPICS ===== */}
              {isOpen && (
                <div className="px-8 pb-6 pt-2 border-t border-zinc-800 bg-zinc-900">
                  <ul className="space-y-2">

                    {module.module_content?.map((topic, tIndex) => {
                      const topicKey = `${module.module_name}-${topic}`;
                      const completionData = userProgress.find(t => t.topicKey === topicKey);
                      const isCompleted = !!completionData;

                      return (
                        <li
                          key={tIndex}
                          onClick={() =>
                            openActivitySelector(
                              module.module_name,
                              topic
                            )
                          }
                          className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition
                          ${
                            isCompleted
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "hover:bg-zinc-800 text-zinc-300 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center">
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5 mr-3 text-emerald-500" />
                            ) : (
                              <div className="mr-3 w-5 h-5 rounded-full border-2 border-zinc-700" />
                            )}

                            <div>
                                <p className="font-medium">{topic}</p>
                                 {isCompleted && (
                                     <p className="text-[10px] text-emerald-600/70">
                                         {completionData.activityType ? completionData.activityType.toUpperCase() : "LECTURE"} — Completed on {completionData.completedAt && !isNaN(new Date(completionData.completedAt).getTime()) ? new Date(completionData.completedAt).toLocaleDateString() : new Date().toLocaleDateString()}
                                     </p>
                                 )}
                            </div>
                          </div>

                          {isCompleted ? (
                            <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                              DONE
                            </span>
                          ) : (
                            <Clock className="w-4 h-4 text-zinc-500" />
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

      {/* ===== ACTIVITY TYPE MODAL ===== */}
      {activityModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl w-80 space-y-4">
            <h3 className="text-lg font-bold text-white">Select Activity Type</h3>
            <p className="text-sm text-zinc-400">{activityModal.topicName}</p>

            <div className="space-y-2">
              {["lecture", "assignment", "practice"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedActivity(type)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition capitalize ${
                    selectedActivity === type
                      ? "bg-blue-600/20 border-blue-500 text-blue-400"
                      : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setActivityModal(null)}
                className="flex-1 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmActivity}
                className="flex-1 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}