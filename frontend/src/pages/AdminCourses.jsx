import { useEffect, useState, useRef } from "react";
import {
 Search,
 Plus,
 BookOpen,
 User,
 Layers,
 Edit2,
 Trash2,
 FileUp,
 CheckCircle2,
 AlertCircle,
 X,
 CheckSquare,
 Link2
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

 // Mark Complete state
 const [showCompleteModal, setShowCompleteModal] = useState(null); // course object or null
 const [allStudents, setAllStudents] = useState([]);
 const [selectedStudents, setSelectedStudents] = useState(new Set());
 const [completing, setCompleting] = useState(false);

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

 const openCompleteModal = (course) => {
  setShowCompleteModal(course);
  setSelectedStudents(new Set());
  // Fetch all students
  fetch(`${API_BASE_URL}/users/students`)
   .then((res) => res.json())
   .then((data) => {
    const enrolled = data.filter(
     (s) => s.assignedCourses && s.assignedCourses.includes(course._id)
    );
    setAllStudents(enrolled);
   })
   .catch(() => setAllStudents([]));
 };

 const toggleStudent = (id) => {
  setSelectedStudents((prev) => {
   const next = new Set(prev);
   if (next.has(id)) next.delete(id);
   else next.add(id);
   return next;
  });
 };

 const toggleAll = () => {
  if (selectedStudents.size === allStudents.length) {
   setSelectedStudents(new Set());
  } else {
   setSelectedStudents(new Set(allStudents.map((s) => s._id)));
  }
 };

 const handleCompleteCourse = async () => {
  if (selectedStudents.size === 0) return;
  setCompleting(true);
  try {
   const res = await fetch(`${API_BASE_URL}/users/complete-course`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     studentIds: Array.from(selectedStudents),
     courseId: showCompleteModal._id,
    }),
   });
   const data = await res.json();
   if (res.ok) {
    setImportStatus({ type: "success", message: data.message });
    setShowCompleteModal(null);
   } else {
    setImportStatus({ type: "error", message: data.message || "Failed" });
   }
  } catch {
   setImportStatus({ type: "error", message: "Failed to mark course complete" });
  }
  setCompleting(false);
  setTimeout(() => setImportStatus(null), 4000);
 };

 const openEditModal = (course) => {
  setEditingCourse(JSON.parse(JSON.stringify(course)));
  setShowModal(true);
 };

 const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setIsImporting(true);
  setImportStatus({ type: "info", message: "Uploading Excel file..." });

  const formData = new FormData();
  formData.append("file", file);

  try {
   const response = await fetch(`${API_BASE_URL}/courses/upload-excel`, {
    method: "POST",
    body: formData,
   });

   const result = await response.json();

   if (!response.ok) {
    throw new Error(result.message || "Server error");
   }

   setImportStatus({
    type: "success",
    message: `Successfully imported ${result.count} courses!`,
   });

   fetchCourses();
  } catch (err) {
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

 const filteredCourses = courses.filter(
  (course) =>
   course.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
   course.description
    ?.toLowerCase()
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
   setImportStatus({ type: "error", message: "Error deleting course" });
   setTimeout(() => setImportStatus(null), 4000);
  }
 };

 const saveCourseUpdate = async () => {
  try {
   const res = await fetch(
    `${API_BASE_URL}/courses/${editingCourse._id || editingCourse.course_id}`,
    {
     method: "PUT",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify(editingCourse),
    },
   );

   setImportStatus({ type: "success", message: "Course Updated Successfully" });
   setTimeout(() => setImportStatus(null), 5000);
   setShowModal(false);
   setEditingCourse(null);
   fetchCourses();
  } catch (err) {
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
  setEditingCourse({ ...editingCourse, modules: updated });
 };

 const addTopic = (moduleIndex) => {
  const updated = [...editingCourse.modules];
  updated[moduleIndex].module_content.push({ name: "New Topic", assignmentLink: "" });
  setEditingCourse({ ...editingCourse, modules: updated });
 };
 const deleteTopic = (moduleIndex, topicIndex) => {
  const updated = [...editingCourse.modules];
  updated[moduleIndex].module_content.splice(topicIndex, 1);
  setEditingCourse({ ...editingCourse, modules: updated });
 };

 return (
  <div className="space-y-6">
   {/* Edit Modal */}
   {showModal && editingCourse && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-3xl w-full max-w-3xl p-6 overflow-y-auto max-h-[90vh] shadow-2xl">
       <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Edit Course</h2>
        <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600 transition">
         <X className="w-5 h-5" />
        </button>
       </div>
      <div className="space-y-4 mb-6">
       <input
        type="text"
        value={editingCourse.course_name}
        onChange={(e) =>
         setEditingCourse({ ...editingCourse, course_name: e.target.value })
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
      <div className="space-y-6">
        {editingCourse.modules.map((module, mIndex) => (
         <div key={module.module_id || module._id || mIndex} className="border rounded-2xl p-4 space-y-3">
         <div className="flex justify-between items-center">
          <input
           type="text"
           value={module.module_name}
           onChange={(e) => {
            const updated = [...editingCourse.modules];
            updated[mIndex].module_name = e.target.value;
            setEditingCourse({ ...editingCourse, modules: updated });
           }}
           className="font-semibold text-lg w-full mr-2"
          />
          <button onClick={() => deleteModule(mIndex)} className="text-red-500">
           Delete
          </button>
         </div>
         {module.module_content.map((topic, tIndex) => {
          const topicName = typeof topic === "string" ? topic : topic.name || "";
          const assignmentLink = typeof topic === "object" ? (topic.assignmentLink || "") : "";

          return (
           <div key={tIndex} className="space-y-2">
            <div className="flex gap-2">
             <input
              type="text"
              value={topicName}
              onChange={(e) => {
               const updated = [...editingCourse.modules];
               if (typeof updated[mIndex].module_content[tIndex] === "string") {
                updated[mIndex].module_content[tIndex] = { name: e.target.value, assignmentLink: "" };
               } else {
                updated[mIndex].module_content[tIndex].name = e.target.value;
               }
               setEditingCourse({ ...editingCourse, modules: updated });
              }}
              className="flex-1 p-2 border rounded-lg"
              placeholder="Topic name"
             />
             <button
              onClick={() => deleteTopic(mIndex, tIndex)}
              className="text-red-500"
             >
              X
             </button>
            </div>
            <div className="flex items-center gap-2 pl-2">
             <Link2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <input
               type="text"
               value={assignmentLink}
               onChange={(e) => {
               const updated = [...editingCourse.modules];
               if (typeof updated[mIndex].module_content[tIndex] === "string") {
                updated[mIndex].module_content[tIndex] = { name: updated[mIndex].module_content[tIndex], assignmentLink: e.target.value };
               } else {
                updated[mIndex].module_content[tIndex].assignmentLink = e.target.value;
               }
               setEditingCourse({ ...editingCourse, modules: updated });
              }}
              className="flex-1 p-1.5 text-xs border rounded-lg"
              placeholder="Assignment link (optional)"
             />
            </div>
           </div>
          );
         })}
         <button
          onClick={() => addTopic(mIndex)}
          className="text-blue-600 font-medium"
         >
          + Add Topic
         </button>
        </div>
       ))}
       <button onClick={addModule} className="bg-blue-600 text-white px-4 py-2 rounded-xl">
        + Add Module
       </button>
      </div>
      <div className="flex justify-end gap-3 mt-6">
       <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border">
        Cancel
       </button>
       <button onClick={saveCourseUpdate} className="px-4 py-2 rounded-xl bg-blue-600 text-white">
        Save Changes
       </button>
      </div>
     </div>
    </div>
   )}

   {/* Mark Complete Modal */}
   {showCompleteModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
     <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl">
      <div className="flex justify-between items-center mb-4">
       <h2 className="text-xl font-bold">Mark Course Complete</h2>
       <button
        onClick={() => setShowCompleteModal(null)}
        className="text-zinc-400 hover:text-zinc-600 transition"
       >
        <X className="w-5 h-5" />
       </button>
      </div>
      <p className="text-sm text-zinc-500 mb-4">
       Select students enrolled in <strong>{showCompleteModal.course_name}</strong> to mark the course as 100% complete.
      </p>

      {allStudents.length === 0 ? (
       <div className="py-8 text-center text-zinc-400">No students enrolled in this course</div>
      ) : (
       <>
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 rounded-xl mb-2">
         <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
          <input
           type="checkbox"
           checked={selectedStudents.size === allStudents.length}
           onChange={toggleAll}
           className="w-4 h-4"
          />
          Select All ({allStudents.length})
         </label>
         <span className="text-xs text-zinc-500">{selectedStudents.size} selected</span>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1 border border-zinc-100 rounded-xl p-2">
         {allStudents.map((student) => (
          <label
           key={student._id}
           className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-50 cursor-pointer transition"
          >
           <input
            type="checkbox"
            checked={selectedStudents.has(student._id)}
            onChange={() => toggleStudent(student._id)}
            className="w-4 h-4"
           />
           <div>
            <p className="text-sm font-medium">{student.username}</p>
            <p className="text-xs text-zinc-500">{student.email}</p>
           </div>
          </label>
         ))}
        </div>
       </>
      )}

      <div className="flex justify-end gap-3 mt-6">
       <button
        onClick={() => setShowCompleteModal(null)}
        className="px-4 py-2 rounded-xl border"
       >
        Cancel
       </button>
       <button
        onClick={handleCompleteCourse}
        disabled={selectedStudents.size === 0 || completing}
        className="px-4 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-50 transition font-medium"
       >
        {completing ? "Completing..." : `Complete for ${selectedStudents.size} Student(s)`}
       </button>
      </div>
     </div>
    </div>
   )}

   {/* Toast */}
   {importStatus && (
    <div className="fixed top-20 right-8 z-50">
     <div
      className={`px-6 py-4 rounded-2xl shadow-2xl border flex items-center space-x-3 ${
       importStatus.type === "success"
        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
        : importStatus.type === "error"
        ? "bg-red-50 border-red-200 text-red-800"
        : "bg-blue-50 border-blue-200 text-blue-800"
      }`}
     >
      {importStatus.type === "success" ? (
       <CheckCircle2 className="w-5 h-5" />
      ) : importStatus.type === "error" ? (
       <AlertCircle className="w-5 h-5" />
      ) : (
       <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      )}
      <span className="font-medium">{importStatus.message}</span>
      <button onClick={() => setImportStatus(null)} className="ml-2 opacity-60 hover:opacity-100">
       <X className="w-4 h-4" />
      </button>
     </div>
    </div>
   )}

   {/* Header */}
   <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
    <div className="relative w-full lg:w-96">
     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
     <input
      type="text"
      placeholder="Search courses by title..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all shadow-sm"
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
      className="flex items-center justify-center px-6 py-3 bg-white border border-zinc-200 text-zinc-700 font-semibold rounded-2xl shadow-sm hover:bg-zinc-50 transition-all disabled:opacity-50"
     >
      <FileUp className="w-5 h-5 mr-2" />
      Import Excel
     </button>
    </div>
   </div>

   {/* Table */}
   <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
     <table className="w-full text-left border-collapse">
      <thead>
       <tr className="border-b border-zinc-100">
        <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Course Title</th>
        <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Modules</th>
        <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
       </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100">
       {isLoading ? (
        [1, 2, 3].map((i) => (
         <tr key={i} className="animate-pulse">
          <td className="px-6 py-4"><div className="h-10 w-64 bg-zinc-100 rounded-lg" /></td>
          <td className="px-6 py-4"><div className="h-6 w-32 bg-zinc-100 rounded-full" /></td>
          <td className="px-6 py-4"><div className="h-6 w-12 bg-zinc-100 rounded-full" /></td>
         </tr>
        ))
       ) : filteredCourses.length > 0 ? (
        filteredCourses.map((course) => (
         <tr key={course._id} className="hover:bg-zinc-50 transition-colors">
          <td className="px-6 py-4">
           <div className="flex items-center">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
             <BookOpen className="w-6 h-6" />
            </div>
            <div className="ml-4">
             <p className="font-semibold text-zinc-900">{course.course_name}</p>
             <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1 max-w-xs">{course.course_description}</p>
            </div>
           </div>
          </td>
          <td className="px-6 py-4">
           <div className="flex items-center text-sm">
            <Layers className="w-4 h-4 mr-2 text-zinc-400" />
            <span className="font-medium">{course.modules?.length || 0} Modules</span>
           </div>
          </td>
          <td className="px-6 py-4 text-right">
           <div className="flex justify-end space-x-2">
            <button
             onClick={() => openCompleteModal(course)}
             className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
             title="Mark Complete for Students"
            >
             <CheckSquare className="w-4 h-4" />
            </button>
            <button
             onClick={() => openEditModal(course)}
             className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors"
            >
             <Edit2 className="w-4 h-4" />
            </button>
            <button
             onClick={() => handleDelete(course._id)}
             className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
            >
             <Trash2 className="w-4 h-4" />
            </button>
           </div>
          </td>
         </tr>
        ))
       ) : (
        <tr>
         <td colSpan={3} className="px-6 py-12 text-center text-zinc-500">No courses found.</td>
        </tr>
       )}
      </tbody>
     </table>
    </div>
   </div>
  </div>
 );
}
