import { useEffect, useState } from 'react';
import { Users, Mail, Search, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../constants';
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
 const { user } = useAuth();

 const [students, setStudents] = useState([]);
 const [courses, setCourses] = useState([]);
 const [filteredStudents, setFilteredStudents] = useState([]);

 const [search, setSearch] = useState('');
 const [selectedCourse, setSelectedCourse] = useState('');

 const [isLoading, setIsLoading] = useState(true);

 useEffect(() => {
 if (user) {
 Promise.all([
 fetch(`${API_BASE_URL}/users/teacher/${user._id}/students`).then(res => res.json()),
 fetch(`${API_BASE_URL}/courses`).then(res => res.json())
 ])
 .then(([studentData, courseData]) => {
 setStudents(studentData);
 setFilteredStudents(studentData);
 setCourses(courseData);
 setIsLoading(false);
 })
 .catch(() => setIsLoading(false));
 }
 }, [user]);

 // 🔎 SEARCH + FILTER LOGIC
 useEffect(() => {
 let data = students;

 // Search by name/email
 if (search) {
 data = data.filter(s =>
 s.username.toLowerCase().includes(search.toLowerCase()) ||
 s.email.toLowerCase().includes(search.toLowerCase())
 );
 }

 // Filter by course
 if (selectedCourse) {
 data = data.filter(s =>
 s.assignedCourses?.includes(selectedCourse)
 );
 }

 setFilteredStudents(data);
 }, [search, selectedCourse, students]);

 return (
 <div className="space-y-8">

 {/* ===== HEADER ===== */}
 <div>
 <h2 className="text-3xl font-bold">
 Welcome back, {user?.username?.split(' ')[0] || 'Teacher'}!
 </h2>
 <p className="text-zinc-500 mt-1">
 Manage your assigned students
 </p>
 </div>

 {/* ===== SEARCH + FILTER BAR ===== */}
 <div className="flex flex-col md:flex-row gap-4">

 {/* Search */}
 <div className="relative flex-1">
 <Search className="absolute left-3 top-3 text-zinc-400 w-5 h-5" />
 <input
 type="text"
 placeholder="Search by name or email..."
 value={search}
 onChange={e => setSearch(e.target.value)}
 className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-300 bg-white "
 />
 </div>

 {/* Course Filter */}
 <select
 value={selectedCourse}
 onChange={e => setSelectedCourse(e.target.value)}
 className="px-4 py-2 rounded-xl border border-zinc-300 bg-white "
 >
 <option value="">All Courses</option>
 {courses.map(course => (
 <option key={course._id} value={course._id}>
 {course.course_name}
 </option>
 ))}
 </select>

 </div>

 {/* ===== COURSES SECTION ===== */}
 <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden">
 <div className="p-4 border-b border-zinc-200 bg-zinc-50 ">
 <h3 className="font-bold flex items-center gap-2">
 <BookOpen className="w-4 h-4" /> Courses
 </h3>
 </div>
 <div className="p-4 flex flex-wrap gap-2">
 {courses.map(course => (
 <Link
 key={course._id}
 to={`/teacher/course/${course._id}`}
 className="px-4 py-2 bg-zinc-100 hover:bg-blue-50 :bg-blue-900/20 text-sm font-medium rounded-xl transition"
 >
 {course.course_name}
 </Link>
 ))}
 </div>
 </div>

 {/* ===== STUDENT LIST ===== */}
 <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden">

 {isLoading ? (
 <div className="p-10 text-center">Loading students...</div>
 ) : filteredStudents.length > 0 ? (

 <table className="w-full">

 {/* TABLE HEADER */}
 <thead className="bg-zinc-50 text-left">
 <tr>
 <th className="p-4">Student</th>
 <th>Email</th>
 <th>Courses</th>
 <th>Role</th>
 </tr>
 </thead>

 {/* TABLE BODY */}
 <tbody>

 {filteredStudents.map(student => (

 <tr
 key={student._id}
 className="border-t border-zinc-200 hover:bg-zinc-50 :bg-zinc-800 transition"
 >

 <td className="p-4">
 <Link to={`/teacher/student/${student._id}`}>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
 <Users className="w-5 h-5 text-blue-600" />
 </div>
 <span className="font-semibold">
 {student.username}
 </span>
 </div>
 </Link>
 </td>

 <td>
 <div className="flex items-center gap-2 text-zinc-500">
 <Mail className="w-4 h-4" />
 {student.email}
 </div>
 </td>

 <td>
 {student.assignedCourses?.length || 0}
 </td>

 <td className="capitalize font-medium text-zinc-600">
 {student.role}
 </td>

 </tr>

 ))}

 </tbody>
 </table>

 ) : (

 <div className="p-10 text-center text-zinc-500">
 No students found
 </div>

 )}

 </div>
 </div>
 );
}