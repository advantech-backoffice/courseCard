import { useEffect, useState, useRef } from "react";
import {
  Search,
  Plus,
  BookOpen,
  User,
  Layers,
  Edit2,
  Trash2,
  ExternalLink,
  FileUp,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { API_BASE_URL } from "../constants";
import * as XLSX from "xlsx";

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef(null);

  const fetchCourses = () => {
    setIsLoading(true);
    fetch(`${API_BASE_URL}/courses`)
      .then((res) => res.json())
      .then((data) => {
        setCourses(data);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openEditModal = (course) => {
    setEditingCourse(JSON.parse(JSON.stringify(course))); // deep copy
    setShowModal(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus({ type: "info", message: "Reading Excel file..." });

    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const binary = evt.target.result;

        const workbook = XLSX.read(binary, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(sheet);

        if (!rows.length) throw new Error("Excel file is empty");

        // 🔥 GROUP DATA INTO YOUR SCHEMA FORMAT
        const courseMap = new Map();

        rows.forEach((row) => {
          const courseId = Number(row.course_id);

          if (!courseMap.has(courseId)) {
            courseMap.set(courseId, {
              course_id: courseId,
              course_name: String(row.course_name || ""),
              course_description: String(row.course_description || ""),
              modules: [],
            });
          }

          const course = courseMap.get(courseId);

          // ----- MODULE -----
          if (row.module_id) {
            const moduleId = Number(row.module_id);

            let module = course.modules.find((m) => m.module_id === moduleId);

            if (!module) {
              module = {
                module_id: moduleId,
                module_name: String(row.module_name || ""),
                module_content: [],
              };

              course.modules.push(module);
            }

            // ----- MODULE CONTENT -----
            if (row.module_content) {
              const contentArray = String(row.module_content)
                .split(";")
                .map((item) => item.trim())
                .filter(Boolean);

              module.module_content.push(...contentArray);
            }
          }
        });

        const finalCourses = Array.from(courseMap.values());

        setImportStatus({
          type: "info",
          message: `Uploading ${finalCourses.length} courses...`,
        });

        // 🔥 SEND TO BACKEND
        const response = await fetch(`${API_BASE_URL}/courses/bulk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(finalCourses),
        });

        const resultText = await response.text();

        if (!response.ok) {
          throw new Error(resultText || "Server error");
        }

        setImportStatus({
          type: "success",
          message: `Successfully imported ${finalCourses.length} courses!`,
        });

        fetchCourses();
      } catch (err) {
        console.error(err);

        setImportStatus({
          type: "error",
          message: "Import failed: " + err.message,
        });
      } finally {
        setIsImporting(false);

        if (fileInputRef.current) fileInputRef.current.value = "";

        setTimeout(() => setImportStatus(null), 5000);
      }
    };

    reader.readAsBinaryString(file);
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const handleDelete = async (courseId) => {
    if (!window.confirm("Delete this course?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      fetchCourses();
    } catch (err) {
      alert("Error deleting course" + err);
    }
  };

  const saveCourseUpdate = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/courses/${editingCourse.course_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editingCourse),
        },
      );

      // if (!res.ok) throw new Error("Update failed");
      setImportStatus({ type: "success", message: "Course Updated Successfully" });
      setTimeout(() => setImportStatus(null), 5000);
      setShowModal(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (err) {
      // alert("Update error: " + err);
      setImportStatus({ type: "error", message: "Error Updating Course" });
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  const addModule = () => {
    setEditingCourse({
      ...editingCourse,
      modules: [
        ...editingCourse.modules,
        {
          module_id: Date.now(),
          module_name: "New Module",
          module_content: [],
        },
      ],
    });
  };
  const deleteModule = (index) => {
    const updated = [...editingCourse.modules];
    updated.splice(index, 1);

    setEditingCourse({
      ...editingCourse,
      modules: updated,
    });
  };

  const addTopic = (moduleIndex) => {
    const updated = [...editingCourse.modules];
    updated[moduleIndex].module_content.push("New Topic");

    setEditingCourse({
      ...editingCourse,
      modules: updated,
    });
  };
  const deleteTopic = (moduleIndex, topicIndex) => {
    const updated = [...editingCourse.modules];
    updated[moduleIndex].module_content.splice(topicIndex, 1);

    setEditingCourse({
      ...editingCourse,
      modules: updated,
    });
  };
  return (
    <div className="space-y-6">
      {showModal && editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-3xl p-6 overflow-y-auto max-h-[90vh] shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Edit Course</h2>

            {/* Course Info */}
            <div className="space-y-4 mb-6">
              <input
                type="text"
                value={editingCourse.course_name}
                onChange={(e) =>
                  setEditingCourse({
                    ...editingCourse,
                    course_name: e.target.value,
                  })
                }
                placeholder="Course Name"
                className="w-full p-3 rounded-xl border"
              />

              <textarea
                value={editingCourse.course_description}
                onChange={(e) =>
                  setEditingCourse({
                    ...editingCourse,
                    course_description: e.target.value,
                  })
                }
                placeholder="Course Description"
                className="w-full p-3 rounded-xl border"
              />
            </div>

            {/* Modules */}
            <div className="space-y-6">
              {editingCourse.modules.map((module, mIndex) => (
                <div
                  key={module.module_id}
                  className="border rounded-2xl p-4 space-y-3"
                >
                  {/* Module Header */}
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      value={module.module_name}
                      onChange={(e) => {
                        const updated = [...editingCourse.modules];
                        updated[mIndex].module_name = e.target.value;

                        setEditingCourse({
                          ...editingCourse,
                          modules: updated,
                        });
                      }}
                      className="font-semibold text-lg w-full mr-2"
                    />

                    <button
                      onClick={() => deleteModule(mIndex)}
                      className="text-red-500"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Topics */}
                  {module.module_content.map((topic, tIndex) => (
                    <div key={tIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => {
                          const updated = [...editingCourse.modules];
                          updated[mIndex].module_content[tIndex] =
                            e.target.value;

                          setEditingCourse({
                            ...editingCourse,
                            modules: updated,
                          });
                        }}
                        className="flex-1 p-2 border rounded-lg"
                      />

                      <button
                        onClick={() => deleteTopic(mIndex, tIndex)}
                        className="text-red-500"
                      >
                        ❌
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => addTopic(mIndex)}
                    className="text-indigo-600 font-medium"
                  >
                    + Add Topic
                  </button>
                </div>
              ))}

              <button
                onClick={addModule}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl"
              >
                + Add Module
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl border"
              >
                Cancel
              </button>

              <button
                onClick={saveCourseUpdate}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Status Toast */}
      {importStatus && (
        <div
          className={`fixed top-20 right-8 z-50 animate-in fade-in slide-in-from-right-4 duration-300`}
        >
          <div
            className={`px-6 py-4 rounded-2xl shadow-2xl border flex items-center space-x-3
              ${
                importStatus.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400"
                  : importStatus.type === "error"
                    ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                    : "bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400"
              }`}
          >
            {importStatus.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : importStatus.type === "error" ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            )}
            <span className="font-medium">{importStatus.message}</span>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search courses by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center justify-center px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-2xl shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            <FileUp className="w-5 h-5 mr-2" />
            Import Excel
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Course Title
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Modules
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-10 w-64 bg-zinc-100 dark:bg-zinc-800 rounded-lg"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-32 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : filteredCourses.length > 0 ? (
                filteredCourses.map((course) => (
                  <tr
                    key={course._id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="ml-4">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {course.course_name}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1 max-w-xs">
                            {course.course_description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm">
                        <Layers className="w-4 h-4 mr-2 text-zinc-400" />
                        <span className="font-medium">
                          {course.modulesCount} Modules
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                          onClick={() => {
                            openEditModal(course);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"
                          onClick={() => {
                            handleDelete(course._id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-zinc-500"
                  >
                    No courses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
