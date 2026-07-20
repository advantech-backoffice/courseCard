import { useState, useEffect, useRef } from "react";
import { UserPlus, GraduationCap, CheckCircle2, Search, ChevronDown, Check, X } from "lucide-react";
import { API_BASE_URL } from "../constants";

// Custom Searchable Select Component
const SearchableSelect = ({ options, value, onChange, multiple, placeholder, assignedValues = [] }) => {
 const [isOpen, setIsOpen] = useState(false);
 const [searchTerm, setSearchTerm] = useState("");
 const dropdownRef = useRef(null);

 useEffect(() => {
 const handleClickOutside = (event) => {
 if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
 setIsOpen(false);
 }
 };
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 const filteredOptions = options.filter(opt => 
 opt.label.toLowerCase().includes(searchTerm.toLowerCase())
 );

 const handleSelect = (optValue) => {
 if (multiple) {
 const newValue = value.includes(optValue) 
 ? value.filter(v => v !== optValue) 
 : [...value, optValue];
 onChange(newValue);
 } else {
 onChange(optValue);
 setIsOpen(false);
 }
 };

 const removeValue = (e, optValue) => {
 e.stopPropagation();
 onChange(value.filter(v => v !== optValue));
 };

 return (
 <div className="relative" ref={dropdownRef}>
 <div 
 className="min-h-[3.25rem] w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-600 transition-all cursor-pointer flex items-center justify-between"
 onClick={() => setIsOpen(!isOpen)}
 >
 <div className="flex flex-wrap gap-2 flex-1 items-center">
 {multiple ? (
 value.length > 0 ? (
 value.map(val => {
 const opt = options.find(o => o.value === val);
 return (
 <span key={val} className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-sm font-medium border border-blue-200 shadow-sm transition-all hover:bg-blue-200 :bg-blue-800/80">
 {opt?.label}
 <X className="w-3.5 h-3.5 cursor-pointer hover:text-blue-900 :text-blue-100 transition-colors" onClick={(e) => removeValue(e, val)} />
 </span>
 );
 })
 ) : (
 <span className="text-zinc-500">{placeholder}</span>
 )
 ) : (
 <span className={value ? "text-zinc-900 font-medium" : "text-zinc-500"}>
 {value ? options.find(o => o.value === value)?.label : placeholder}
 </span>
 )}
 </div>
 <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
 </div>

 {isOpen && (
 <div className="absolute z-50 w-full mt-2 bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col transform opacity-100 scale-100 transition-all origin-top">
 <div className="p-3 border-b border-zinc-100 flex items-center gap-3 bg-zinc-50/50 ">
 <Search className="w-4 h-4 text-zinc-400" />
 <input 
 type="text" 
 className="w-full bg-transparent border-none outline-none text-sm placeholder-zinc-400" 
 placeholder="Search options..." 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 onClick={(e) => e.stopPropagation()}
 />
 </div>
 <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar bg-white ">
 {filteredOptions.length > 0 ? (
 filteredOptions.map(opt => {
 const isSelected = multiple ? value.includes(opt.value) : value === opt.value;
 const isAssigned = assignedValues.includes(opt.value);
 return (
 <div 
 key={opt.value}
 className={`px-3 py-2.5 mx-1 my-0.5 rounded-xl flex items-center justify-between cursor-pointer transition-all duration-200 ${
 isAssigned 
 ? 'opacity-60 cursor-not-allowed bg-zinc-50 ' 
 : isSelected 
 ? 'bg-blue-50 text-blue-700 font-medium shadow-sm' 
 : 'hover:bg-zinc-100 :bg-zinc-800 text-zinc-700 hover:scale-[0.98]'
 }`}
 onClick={() => !isAssigned && handleSelect(opt.value)}
 >
 <span className="text-sm">{opt.label}</span>
 {isAssigned ? (
 <span className="text-[11px] uppercase tracking-wider bg-zinc-200 text-zinc-600 px-2.5 py-1 rounded-full font-bold">
 Already Assigned
 </span>
 ) : isSelected && (
 <Check className="w-4 h-4 text-blue-600 " />
 )}
 </div>
 );
 })
 ) : (
 <div className="p-6 text-center text-sm text-zinc-500 flex flex-col items-center gap-2">
 <Search className="w-6 h-6 text-zinc-300 " />
 No results found
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 );
};

export default function AdminAssign() {
 const [students, setStudents] = useState([]);
 const [teachers, setTeachers] = useState([]);
 const [courses, setCourses] = useState([]);
 const [isLoading, setIsLoading] = useState(true);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [success, setSuccess] = useState(false);
 const [error, setError] = useState(null);

 // Form states
 const [selectedStudentForCourse, setSelectedStudentForCourse] = useState("");
 const [selectedCourses, setSelectedCourses] = useState([]);

 const [selectedTeacher, setSelectedTeacher] = useState("");
 const [selectedStudentsForTeacher, setSelectedStudentsForTeacher] = useState([]);

 useEffect(() => {
 fetchData();
 }, []);

 const fetchData = () => {
 Promise.all([
 fetch(`${API_BASE_URL}/users`).then((res) => res.json()),
 fetch(`${API_BASE_URL}/courses`).then((res) => res.json()),
 ]).then(([usersData, coursesData]) => {
 setStudents(usersData.filter((u) => u.role === "student"));
 setTeachers(usersData.filter((u) => u.role === "teacher"));
 setCourses(coursesData);
 setIsLoading(false);
 });
 };

 const handleEnrollStudent = async (e) => {
 e.preventDefault();
 if (!selectedStudentForCourse || selectedCourses.length === 0) return;

 setIsSubmitting(true);
 try {
 const response = await fetch(`${API_BASE_URL}/users/enroll-student`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ 
 studentId: [selectedStudentForCourse], 
 courseId: selectedCourses 
 }),
 });
 if (response.ok) {
 setSuccess(true);
 setTimeout(() => setSuccess(false), 3000);
 setSelectedStudentForCourse("");
 setSelectedCourses([]);
 fetchData();
 } else {
 setError("Failed to enroll student");
 setTimeout(() => setError(null), 4000);
 }
 } catch (err) {
 setError("Network error: " + err.message);
 setTimeout(() => setError(null), 4000);
 } finally {
 setIsSubmitting(false);
 }
 };

 const handleAssignStudentToTeacher = async (e) => {
 e.preventDefault();
 if (!selectedTeacher || selectedStudentsForTeacher.length === 0) return;

 setIsSubmitting(true);

 try {
 const response = await fetch(`${API_BASE_URL}/users/assign-student`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ 
 teacherId: selectedTeacher, 
 studentId: selectedStudentsForTeacher 
 }),
 });

 if (response.ok) {
 setSuccess(true);
 setTimeout(() => setSuccess(false), 3000);
 setSelectedTeacher("");
 setSelectedStudentsForTeacher([]);
 fetchData();
 } else {
 setError("Failed to assign students");
 setTimeout(() => setError(null), 4000);
 }
 } catch (err) {
 setError("Network error: " + err.message);
 setTimeout(() => setError(null), 4000);
 }

 setIsSubmitting(false);
 };

 if (isLoading)
 return (
 <div className="animate-pulse space-y-8">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="h-96 bg-zinc-200 rounded-3xl"></div>
 <div className="h-96 bg-zinc-200 rounded-3xl"></div>
 </div>
 </div>
 );

 const studentOptions = students.map(s => ({ value: s._id, label: `${s.username} (${s.email})` }));
 const teacherOptions = teachers.map(t => ({ value: t._id, label: `${t.username} (${t.email})` }));
 const courseOptions = courses.map(c => ({ value: c._id, label: c.course_name }));

 // Find assigned courses for selected student
 const activeStudent = students.find(s => s._id === selectedStudentForCourse);
 const assignedCoursesToStudent = activeStudent?.assignedCourses || [];

 // Find assigned students for selected teacher
 const activeTeacher = teachers.find(t => t._id === selectedTeacher);
 const assignedStudentsToTeacher = activeTeacher?.assignedStudents || [];

 return (
 <div className="space-y-8 pb-32">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
 <div className="flex items-center mb-8">
 <div className="p-3.5 bg-violet-50 rounded-2xl mr-4 shadow-sm">
 <GraduationCap className="w-6 h-6 text-violet-600 " />
 </div>
 <div>
 <h3 className="text-xl font-bold tracking-tight text-zinc-900 ">Assign Course to Student</h3>
 <p className="text-sm text-zinc-500 font-medium mt-1">
 Enroll a student into multiple courses
 </p>
 </div>
 </div>

 <form onSubmit={handleEnrollStudent} className="space-y-7 flex flex-col flex-1">
 <div className="space-y-2.5">
 <label className="text-sm font-semibold text-zinc-700 ">Select Student</label>
 <SearchableSelect 
 options={studentOptions}
 value={selectedStudentForCourse}
 onChange={(val) => {
 setSelectedStudentForCourse(val);
 setSelectedCourses([]); // Reset courses when student changes
 }}
 multiple={false}
 placeholder="Choose a student..."
 />
 </div>

 <div className="space-y-2.5">
 <label className="text-sm font-semibold text-zinc-700 flex justify-between">
 <span>Select Courses</span>
 {selectedCourses.length > 0 && <span className="text-violet-600 ">{selectedCourses.length} selected</span>}
 </label>
 <SearchableSelect 
 options={courseOptions}
 value={selectedCourses}
 onChange={setSelectedCourses}
 multiple={true}
 placeholder={selectedStudentForCourse ? "Choose courses..." : "Please select a student first"}
 assignedValues={assignedCoursesToStudent}
 />
 </div>

 <div className="mt-auto pt-8">
 <button
 type="submit"
 disabled={isSubmitting || !selectedStudentForCourse || selectedCourses.length === 0}
 className="w-full py-4 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-violet-600/20 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
 >
 {isSubmitting ? "Enrolling..." : "Enroll Student"}
 </button>
 </div>
 </form>
 </div>

 <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
 <div className="flex items-center mb-8">
 <div className="p-3.5 bg-blue-50 rounded-2xl mr-4 shadow-sm">
 <UserPlus className="w-6 h-6 text-blue-600 " />
 </div>
 <div>
 <h3 className="text-xl font-bold tracking-tight text-zinc-900 ">Assign Students to Teacher</h3>
 <p className="text-sm text-zinc-500 font-medium mt-1">
 Link students to a teacher for mentorship
 </p>
 </div>
 </div>

 <form onSubmit={handleAssignStudentToTeacher} className="space-y-7 flex flex-col flex-1">
 <div className="space-y-2.5">
 <label className="text-sm font-semibold text-zinc-700 ">Select Teacher</label>
 <SearchableSelect 
 options={teacherOptions}
 value={selectedTeacher}
 onChange={(val) => {
 setSelectedTeacher(val);
 setSelectedStudentsForTeacher([]); // Reset students when teacher changes
 }}
 multiple={false}
 placeholder="Choose a teacher..."
 />
 </div>

 <div className="space-y-2.5">
 <label className="text-sm font-semibold text-zinc-700 flex justify-between">
 <span>Select Students</span>
 {selectedStudentsForTeacher.length > 0 && <span className="text-blue-600 ">{selectedStudentsForTeacher.length} selected</span>}
 </label>
 <SearchableSelect 
 options={studentOptions}
 value={selectedStudentsForTeacher}
 onChange={setSelectedStudentsForTeacher}
 multiple={true}
 placeholder={selectedTeacher ? "Choose students..." : "Please select a teacher first"}
 assignedValues={assignedStudentsToTeacher}
 />
 </div>

 <div className="mt-auto pt-8">
 <button
 type="submit"
 disabled={isSubmitting || !selectedTeacher || selectedStudentsForTeacher.length === 0}
 className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
 >
 {isSubmitting ? "Assigning..." : "Assign Students"}
 </button>
 </div>
 </form>
 </div>
 </div>

 {error && (
 <div className="fixed bottom-8 right-8 z-50">
 <div className="bg-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-semibold">
 {error}
 </div>
 </div>
 )}

 {success && (
 <div className="fixed bottom-8 right-8 z-50">
 <div className="bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-semibold">
 <div className="bg-white/20 p-1 rounded-full">
 <CheckCircle2 className="w-5 h-5" />
 </div>
 Assignment successful!
 </div>
 </div>
 )}
 </div>
 );
}
