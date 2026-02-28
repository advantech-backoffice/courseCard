import React, { useState, useEffect } from "react";
import { UserPlus, GraduationCap, CheckCircle2 } from "lucide-react";
import { API_BASE_URL } from "../constants";

export default function AdminAssign() {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/users`).then((res) => res.json()),
      fetch(`${API_BASE_URL}/courses`).then((res) => res.json()),
    ]).then(([usersData, coursesData]) => {
      setStudents(usersData.filter((u) => u.role === "student"));
      setTeachers(usersData.filter((u) => u.role === "teacher"));
      setCourses(coursesData);
      setIsLoading(false);
    });
  }, []);


  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    const studentId = e.target.studentId.value;
    const courseId = e.target.courseId.value;
    if (!studentId || !courseId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/enroll-student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, courseId }),
      });
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignStudentToTeacher = async (e) => {
    e.preventDefault();

    const teacherId = e.target.teacherId.value;
    const studentId = e.target.studentId.value;

    if (!teacherId || !studentId) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/assign-student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, studentId }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }

    setIsSubmitting(false);
  };

  if (isLoading)
    return (
      <div className="animate-pulse space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-3xl"></div>
          <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-3xl"></div>
        </div>
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-2xl mr-4">
              <GraduationCap className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Assign Course to Student</h3>
              <p className="text-sm text-zinc-500">
                Enroll a student into a course
              </p>
            </div>
          </div>

          <form onSubmit={handleEnrollStudent} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Student</label>
              <select
                name="studentId"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
              >
                <option value="">Choose a student...</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.username} ({s.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Course</label>
              <select
                name="courseId"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
              >
                <option value="">Choose a course...</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.course_name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-violet-600/20 disabled:opacity-70"
            >
              {isSubmitting ? "Enrolling..." : "Enroll Student"}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border shadow-sm">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl mr-4">
              <UserPlus className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Assign Student to Teacher</h3>
              <p className="text-sm text-zinc-500">
                Link a student to a teacher for mentorship
              </p>
            </div>
          </div>

          <form onSubmit={handleAssignStudentToTeacher} className="space-y-6">
            <div>
              <label className="text-sm font-medium">Select Teacher</label>
              <select
                name="teacherId"
                className="w-full px-4 py-3 border rounded-xl"
              >
                <option value="">Choose teacher...</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Select Student</label>
              <select
                name="studentId"
                className="w-full px-4 py-3 border rounded-xl"
              >
                <option value="">Choose student...</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.username}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl"
            >
              {isSubmitting ? "Assigning..." : "Assign Student"}
            </button>
          </form>
        </div>
      </div>

      {success && (
        <div className="fixed bottom-8 right-8 animate-bounce">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Assignment successful!
          </div>
        </div>
      )}
    </div>
  );
}
