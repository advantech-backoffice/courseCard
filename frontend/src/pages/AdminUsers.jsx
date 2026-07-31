import { useEffect, useState, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, Upload, Download, CheckCircle2, AlertCircle, X, CheckSquare, StopCircle, Filter, ArrowUpDown, ChevronDown } from 'lucide-react';
import { API_BASE_URL } from '../constants';

export default function AdminUsers() {
 const [users, setUsers] = useState([]);
 const [searchTerm, setSearchTerm] = useState('');
 const [roleFilter, setRoleFilter] = useState('all');
 const [sortBy, setSortBy] = useState('name-asc');
 const [isLoading, setIsLoading] = useState(true);

 const [showAddModal, setShowAddModal] = useState(false);
 const [editingUser, setEditingUser] = useState(null);

 const [formData, setFormData] = useState({
  username: '',
  email: '',
  password: '',
  role: ''
 });

 const [toast, setToast] = useState(null);
 const showToast = (type, message) => {
  setToast({ type, message });
  setTimeout(() => setToast(null), 4000);
 };

 const fileInputRef = useRef(null);
 const [uploading, setUploading] = useState(false);

 // Complete course modal
 const [completeModalStudent, setCompleteModalStudent] = useState(null);
 const [studentCourses, setStudentCourses] = useState([]);
 const [completingCourse, setCompletingCourse] = useState(null);
 const [expandedCourse, setExpandedCourse] = useState(null);

 // Discontinuation reason modal
 const [discontinueModalUser, setDiscontinueModalUser] = useState(null);
 const [discontinueReason, setDiscontinueReason] = useState("");

 const fetchUsers = async () => {
  try {
   const res = await fetch(`${API_BASE_URL}/users`);
   const data = await res.json();
   setUsers(data.filter((user) => user.role !== "admin"));
  } catch (err) {
   showToast('error', 'Failed to load users');
  }
  setIsLoading(false);
 };

 useEffect(() => {
  fetchUsers();
 }, []);

 const filteredUsers = users
  .filter(user => {
   const matchesSearch =
    (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
   const matchesRole = roleFilter === 'all' || user.role === roleFilter;
   return matchesSearch && matchesRole;
  })
  .sort((a, b) => {
   switch (sortBy) {
    case 'name-asc':
     return (a.username || '').localeCompare(b.username || '');
    case 'name-desc':
     return (b.username || '').localeCompare(a.username || '');
    case 'role-asc':
     return (a.role || '').localeCompare(b.role || '');
    case 'role-desc':
     return (b.role || '').localeCompare(a.role || '');
    case 'newest':
     return new Date(b.createdAt) - new Date(a.createdAt);
    case 'oldest':
     return new Date(a.createdAt) - new Date(b.createdAt);
    default:
     return 0;
   }
  });

 const handleChange = e => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
 };

 const handleAddUser = async () => {
  if (!formData.username || !formData.email || !formData.password || !formData.role) {
   showToast('error', 'Please fill out all fields, including role.');
   return;
  }
  try {
   const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
   });
   if (res.ok) {
    fetchUsers();
    setShowAddModal(false);
    setFormData({ username: '', email: '', password: '', role: '' });
    showToast('success', 'User created successfully');
   } else {
    const errorData = await res.json().catch(() => ({}));
    showToast('error', `Error: ${errorData.message || 'Unknown error'}`);
   }
  } catch (err) {
   showToast('error', 'Failed to create user');
  }
 };

  const handleEditUser = async () => {
   if (!formData.username || !formData.email) {
    showToast('error', 'Please fill out name and email.');
    return;
   }
   try {
    const payload = { ...formData };
    if (!payload.password) delete payload.password;
    const res = await fetch(`${API_BASE_URL}/users/${editingUser._id}`, {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(payload)
    });
   if (res.ok) {
    fetchUsers();
    setEditingUser(null);
    showToast('success', 'User updated successfully');
   } else {
    const errorData = await res.json().catch(() => ({}));
    showToast('error', `Error: ${errorData.message || 'Unknown error'}`);
   }
  } catch (err) {
   showToast('error', 'Failed to update user');
  }
 };

 const handleDelete = async (id, name) => {
  if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
  try {
   const res = await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
   if (res.ok) {
    fetchUsers();
    showToast('success', 'User deleted');
   } else {
    showToast('error', 'Failed to delete user');
   }
  } catch (err) {
   showToast('error', 'Failed to delete user');
  }
 };

 const toggleDiscontinued = async (userId, reason = "") => {
  try {
   const res = await fetch(`${API_BASE_URL}/users/${userId}/discontinued`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
   });
   const data = await res.json();
   if (res.ok) {
    showToast('success', data.message);
    fetchUsers();
   } else {
    showToast('error', data.message || 'Failed');
   }
  } catch {
   showToast('error', 'Failed to update status');
  }
 };

 const handleDiscontinueSubmit = () => {
  if (discontinueModalUser) {
   toggleDiscontinued(discontinueModalUser._id, discontinueReason);
   setDiscontinueModalUser(null);
   setDiscontinueReason("");
  }
 };

 const openCompleteModal = (student) => {
  setCompleteModalStudent(student);
  // Fetch student's enrolled courses
  fetch(`${API_BASE_URL}/users/student/${student._id}/courses`)
   .then(res => res.json())
   .then(data => setStudentCourses(Array.isArray(data) ? data : []))
   .catch(() => setStudentCourses([]));
 };

 const handleMarkCourseComplete = async (courseId) => {
  setCompletingCourse(courseId);
  try {
   const res = await fetch(`${API_BASE_URL}/users/complete-course`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentIds: [completeModalStudent._id], courseId }),
   });
   const data = await res.json();
   if (res.ok) {
    showToast('success', data.message);
    setCompleteModalStudent(null);
   } else {
    showToast('error', data.message || 'Failed');
   }
  } catch {
   showToast('error', 'Failed to complete course');
   }
  setCompletingCourse(null);
 };

 const handleMarkModuleComplete = async (courseId, moduleName) => {
  setCompletingCourse(courseId + moduleName);
  try {
   const res = await fetch(`${API_BASE_URL}/users/complete-module`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentIds: [completeModalStudent._id], courseId, moduleNames: [moduleName] }),
   });
   const data = await res.json();
   if (res.ok) {
    showToast('success', data.message);
    // Refresh courses
    fetch(`${API_BASE_URL}/users/student/${completeModalStudent._id}/courses`)
     .then(res => res.json())
     .then(data => setStudentCourses(Array.isArray(data) ? data : []));
   } else {
    showToast('error', data.message || 'Failed');
   }
  } catch {
   showToast('error', 'Failed to complete module');
  }
  setCompletingCourse(null);
 };

 const openEditModal = user => {
  setEditingUser(user);
  setFormData({ username: user.username, email: user.email, password: '', role: user.role });
 };

 const handleBulkUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setUploading(true);
  const formDataObj = new FormData();
  formDataObj.append("file", file);
  try {
   const res = await fetch(`${API_BASE_URL}/users/bulk-upload`, { method: "POST", body: formDataObj });
   const data = await res.json();
   if (res.ok) {
    let msg = data.message;
    if (data.errors && data.errors.length > 0) msg += " Warnings: " + data.errors.join("; ");
    showToast('success', msg);
    fetchUsers();
   } else {
    showToast('error', data.message || 'Upload failed');
   }
  } catch (err) {
   showToast('error', 'Upload failed: ' + err.message);
  } finally {
   setUploading(false);
   if (fileInputRef.current) fileInputRef.current.value = "";
  }
 };

 return (
  <div className="space-y-6">

   {/* Toast */}
   {toast && (
    <div className="fixed top-20 right-8 z-50">
     <div className={`px-6 py-4 rounded-2xl shadow-2xl border flex items-center space-x-3 ${
      toast.type === 'success'
       ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
       : 'bg-red-50 border-red-200 text-red-800'
     }`}>
      {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <span className="font-medium text-sm">{toast.message}</span>
      <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
     </div>
    </div>
   )}

   {/* Complete Course Modal */}
   {completeModalStudent && (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
     <div className="bg-white p-6 rounded-2xl w-full max-w-lg space-y-4 border border-zinc-200 shadow-2xl max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center">
       <h2 className="text-lg font-bold">Mark Complete</h2>
       <button onClick={() => setCompleteModalStudent(null)} className="text-zinc-400 hover:text-zinc-600 transition"><X className="w-5 h-5" /></button>
      </div>
      <p className="text-sm text-zinc-500">Select modules or entire courses for <strong>{completeModalStudent.username}</strong></p>

      {studentCourses.length === 0 ? (
       <p className="text-sm text-zinc-400 py-4 text-center">No courses enrolled</p>
      ) : (
       <div className="space-y-3">
        {studentCourses.map(course => (
         <div key={course._id} className="rounded-xl border border-zinc-100 overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-zinc-50">
           <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{course.course_name}</p>
            <p className="text-xs text-zinc-500">{course.progress || 0}% complete</p>
           </div>
           <div className="flex items-center gap-2">
            <button
             onClick={() => setExpandedCourse(expandedCourse === course._id ? null : course._id)}
             className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
            >
             {expandedCourse === course._id ? "Hide Modules" : "Modules"}
            </button>
            <button
             onClick={() => handleMarkCourseComplete(course._id)}
             disabled={completingCourse === course._id || course.progress === 100}
             className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition"
            >
             {completingCourse === course._id ? "..." : course.progress === 100 ? "Done" : "Complete Course"}
            </button>
           </div>
          </div>
          {expandedCourse === course._id && course.modules && (
           <div className="border-t border-zinc-100 p-2 space-y-1">
            {course.modules.map((mod, i) => {
             const totalTopics = mod.module_content?.length || 0;
             const completedTopics = mod.module_content?.filter(t => {
              const topicName = typeof t === "string" ? t : t.name;
              return (course.completedTopics || []).some(ct => ct.topicKey === `${mod.module_name}-${topicName}`);
             }).length || 0;
             const isModuleComplete = totalTopics > 0 && completedTopics === totalTopics;
             return (
              <div key={mod._id || i} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-50 transition">
               <div>
                <p className="text-sm font-medium">{mod.module_name}</p>
                <p className="text-xs text-zinc-400">{completedTopics}/{totalTopics} topics</p>
               </div>
               <button
                onClick={() => handleMarkModuleComplete(course._id, mod.module_name)}
                disabled={completingCourse === course._id + mod.module_name || isModuleComplete}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition"
               >
                {completingCourse === course._id + mod.module_name ? "..." : isModuleComplete ? "Done" : "Complete Module"}
               </button>
              </div>
             );
            })}
           </div>
          )}
         </div>
        ))}
       </div>
      )}
     </div>
    </div>
   )}

   {/* Discontinue Reason Modal */}
   {discontinueModalUser && (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
     <div className="bg-white p-6 rounded-2xl w-96 space-y-4 border border-zinc-200 shadow-2xl">
      <div className="flex justify-between items-center">
       <h2 className="text-lg font-bold">Discontinue Student</h2>
       <button onClick={() => { setDiscontinueModalUser(null); setDiscontinueReason(""); }} className="text-zinc-400 hover:text-zinc-600 transition"><X className="w-5 h-5" /></button>
      </div>
      <p className="text-sm text-zinc-500">
       Are you sure you want to discontinue <strong>{discontinueModalUser.username}</strong>?
      </p>
      <textarea
       placeholder="Reason for discontinuation (optional)..."
       rows={3}
       value={discontinueReason}
       onChange={(e) => setDiscontinueReason(e.target.value)}
       className="w-full border border-zinc-200 bg-zinc-50 p-3 rounded-lg text-zinc-900 focus:ring-2 focus:ring-red-600 outline-none transition resize-none"
      />
      <div className="flex gap-3">
       <button
        onClick={() => { setDiscontinueModalUser(null); setDiscontinueReason(""); }}
        className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-2.5 rounded-xl transition font-medium"
       >
        Cancel
       </button>
       <button
        onClick={handleDiscontinueSubmit}
        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl transition font-medium"
       >
        Discontinue
       </button>
      </div>
     </div>
    </div>
   )}

   {/* Search + Filters + Add Button */}
   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full md:w-auto">
     <div className="relative flex-1 min-w-0">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
      <input
       type="text"
       placeholder="Search by name or email..."
       value={searchTerm}
       onChange={e => setSearchTerm(e.target.value)}
       className="w-full pl-9 pr-4 py-3 border border-zinc-200 bg-white rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm"
      />
     </div>
     <div className="relative">
      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
      <select
       value={roleFilter}
       onChange={e => setRoleFilter(e.target.value)}
       className="appearance-none pl-9 pr-8 py-3 border border-zinc-200 bg-white rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm cursor-pointer"
      >
       <option value="all">All Roles</option>
       <option value="student">Students</option>
       <option value="teacher">Teachers</option>
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
     </div>
     <div className="relative">
      <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
      <select
       value={sortBy}
       onChange={e => setSortBy(e.target.value)}
       className="appearance-none pl-9 pr-8 py-3 border border-zinc-200 bg-white rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm cursor-pointer"
      >
       <option value="name-asc">Name (A-Z)</option>
       <option value="name-desc">Name (Z-A)</option>
       <option value="role-asc">Role (A-Z)</option>
       <option value="role-desc">Role (Z-A)</option>
       <option value="newest">Newest First</option>
       <option value="oldest">Oldest First</option>
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
     </div>
    </div>
    <div className="flex gap-3 shrink-0">
     <button
      onClick={() => setShowAddModal(true)}
      className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition font-medium"
     >
      <Plus className="mr-2 w-4 h-4" /> Add User
     </button>
     <input type="file" ref={fileInputRef} accept=".xlsx,.xls" onChange={handleBulkUpload} className="hidden" />
     <button
      onClick={() => fileInputRef.current.click()}
      disabled={uploading}
      className="flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-50 transition font-medium"
     >
      <Upload className="mr-2 w-4 h-4" /> {uploading ? "Uploading..." : "Bulk Upload Excel"}
     </button>
     <button
      onClick={() => window.open(`${API_BASE_URL}/users/export`, '_blank')}
      className="flex items-center px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition font-medium"
     >
      <Download className="mr-2 w-4 h-4" /> Export Users
     </button>
    </div>
   </div>

   {/* Users Table */}
   <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
    <table className="w-full">
     <thead>
      <tr className="border-b border-zinc-200">
       <th className="p-4 text-left text-xs font-semibold text-zinc-500 uppercase">User</th>
       <th className="p-4 text-center text-xs font-semibold text-zinc-500 uppercase">Status</th>
       <th className="p-4 text-right text-xs font-semibold text-zinc-500 uppercase">Actions</th>
      </tr>
     </thead>
     <tbody>
      {isLoading ? (
       <tr><td className="p-6 text-zinc-500" colSpan={3}>Loading...</td></tr>
      ) : filteredUsers.length === 0 ? (
       <tr><td className="p-6 text-zinc-500 text-center" colSpan={3}>No users found</td></tr>
      ) : (
       filteredUsers.map(user => (
        <tr key={user._id} className="border-b border-zinc-100 hover:bg-zinc-50 transition">
         <td className="p-4">
          <p className="font-semibold">{user.username}</p>
          <p className="text-sm text-zinc-500">{user.email}</p>
         </td>
         <td className="p-4 text-center">
          <div className="flex flex-col items-center gap-1">
           <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600 capitalize">
            {user.role}
           </span>
            {user.isDiscontinued && (
             <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600" title={user.discontinuationReason || "No reason provided"}>
              Discontinued{user.discontinuationReason ? `: ${user.discontinuationReason}` : ""}
             </span>
            )}
          </div>
         </td>
         <td className="p-4 text-right">
          <div className="flex justify-end items-center gap-1">
           {user.role === 'student' && (
            <>
             <button
              onClick={() => openCompleteModal(user)}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors text-xs font-medium"
              title="Mark Course Complete"
             >
              <CheckSquare size={14} />
              Complete Course
             </button>
              <button
               onClick={() => {
                if (user.isDiscontinued) {
                 toggleDiscontinued(user._id);
                } else {
                 setDiscontinueModalUser(user);
                 setDiscontinueReason("");
                }
               }}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium ${
                user.isDiscontinued
                 ? 'hover:bg-emerald-50 text-emerald-600'
                 : 'hover:bg-red-50 text-red-500'
               }`}
               title={user.isDiscontinued ? "Reactivate Student" : "Discontinue Student"}
              >
               <StopCircle size={14} />
               {user.isDiscontinued ? "Reactivate" : "Discontinue"}
              </button>
            </>
           )}
           <button
            onClick={() => openEditModal(user)}
            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors"
           >
            <Edit2 size={16} />
           </button>
           <button
            onClick={() => handleDelete(user._id, user.username)}
            className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
           >
            <Trash2 size={16} />
           </button>
          </div>
         </td>
        </tr>
       ))
      )}
     </tbody>
    </table>
   </div>

   {/* ADD MODAL */}
   {showAddModal && (
    <Modal
     title="Add New User"
     onClose={() => setShowAddModal(false)}
     onSubmit={handleAddUser}
     formData={formData}
     handleChange={handleChange}
     showPassword
    />
   )}

   {/* EDIT MODAL */}
   {editingUser && (
    <Modal
     title="Edit User"
     onClose={() => setEditingUser(null)}
     onSubmit={handleEditUser}
     formData={formData}
     handleChange={handleChange}
     showPassword
     passwordPlaceholder="New password (leave blank to keep current)"
    />
   )}
  </div>
 );
}

function Modal({ title, onClose, onSubmit, formData, handleChange, showPassword, passwordPlaceholder }) {
 return (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
   <div className="bg-white p-8 rounded-2xl w-96 space-y-4 border border-zinc-200 shadow-2xl">
    <div className="flex justify-between items-center">
     <h2 className="text-xl font-bold">{title}</h2>
     <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition"><X className="w-5 h-5" /></button>
    </div>
    <input
     name="username"
     placeholder="Username"
     value={formData.username}
     onChange={handleChange}
     className="w-full border border-zinc-200 bg-zinc-50 p-3 rounded-lg text-zinc-900 focus:ring-2 focus:ring-blue-600 outline-none transition"
    />
    <input
     name="email"
     type="email"
     placeholder="Email"
     value={formData.email}
     onChange={handleChange}
     className="w-full border border-zinc-200 bg-zinc-50 p-3 rounded-lg text-zinc-900 focus:ring-2 focus:ring-blue-600 outline-none transition"
    />
    {showPassword && (
     <input
      type="password"
      name="password"
      placeholder={passwordPlaceholder || "Password"}
      value={formData.password}
      onChange={handleChange}
      className="w-full border border-zinc-200 bg-zinc-50 p-3 rounded-lg text-zinc-900 focus:ring-2 focus:ring-blue-600 outline-none transition"
     />
    )}
    {showPassword && (
     <div className="w-full border border-zinc-200 bg-zinc-50 p-3 rounded-lg">
      <div className="text-sm font-medium mb-2 text-zinc-700">Select Role</div>
      <div className="flex items-center space-x-4">
       <label className="inline-flex items-center cursor-pointer">
        <input type="radio" name="role" value="student" checked={formData.role === 'student'} onChange={handleChange} className="w-4 h-4" />
        <span className="ml-2 text-zinc-700">Student</span>
       </label>
       <label className="inline-flex items-center cursor-pointer">
        <input type="radio" name="role" value="teacher" checked={formData.role === 'teacher'} onChange={handleChange} className="w-4 h-4" />
        <span className="ml-2 text-zinc-700">Teacher</span>
       </label>
      </div>
     </div>
    )}
    <button
     onClick={onSubmit}
     className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl transition font-medium"
    >
     Save
    </button>
   </div>
  </div>
 );
}
