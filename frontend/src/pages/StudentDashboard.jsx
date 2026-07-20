import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, CheckCircle2, Clock, ExternalLink, AlertCircle, Plus, X, CalendarOff, Bell, ChevronRight, Video } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../constants";

export default function StudentDashboard() {
 const { user, authFetch } = useAuth();

 const [courses, setCourses] = useState([]);
 const [userData, setUserData] = useState(null);
 const [isLoading, setIsLoading] = useState(true);

 // Leave state
 const [leaves, setLeaves] = useState([]);
 const [showLeaveForm, setShowLeaveForm] = useState(false);
 const [leaveForm, setLeaveForm] = useState({ reason: "", startDate: "", endDate: "" });
 const [submittingLeave, setSubmittingLeave] = useState(false);
 const [leaveError, setLeaveError] = useState("");

 // Notices state
 const [notices, setNotices] = useState([]);

 const fetchDashboard = () => {
  if (!user) return;
  authFetch(`${API_BASE_URL}/users/student/${user._id}`)
   .then((res) => res.json())
   .then((data) => {
    setCourses(data.courseData || []);
    setUserData(data.studentData);
    setIsLoading(false);
   })
   .catch(() => setIsLoading(false));
 };

 const fetchLeaves = () => {
  if (!user) return;
  authFetch(`${API_BASE_URL}/leaves/student/${user._id}`)
   .then((res) => res.json())
   .then((data) => setLeaves(Array.isArray(data) ? data : []))
   .catch(() => {});
 };

 const fetchNotices = () => {
  fetch(`${API_BASE_URL}/notices/student`)
   .then((res) => res.json())
   .then((data) => setNotices(Array.isArray(data) ? data.slice(0, 3) : []))
   .catch(() => {});
 };

 useEffect(() => {
  fetchDashboard();
  fetchLeaves();
  fetchNotices();
 }, [user, authFetch]);

 const today = new Date().toISOString().split("T")[0];
 const activeLeave = leaves.find(
  (l) => l.status === "approved" && l.startDate <= today && l.endDate >= today
 );

 const handleSubmitLeave = async () => {
  setLeaveError("");
  if (!leaveForm.reason || !leaveForm.startDate || !leaveForm.endDate) {
   setLeaveError("All fields are required.");
   return;
  }
  if (leaveForm.endDate < leaveForm.startDate) {
   setLeaveError("End date must be after start date.");
   return;
  }
  setSubmittingLeave(true);
  try {
   const res = await authFetch(`${API_BASE_URL}/leaves`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId: user._id, ...leaveForm }),
   });
   const data = await res.json();
   if (res.ok) {
    setShowLeaveForm(false);
    setLeaveForm({ reason: "", startDate: "", endDate: "" });
    fetchLeaves();
   } else {
    setLeaveError(data.message || "Failed to submit leave");
   }
  } catch {
    setLeaveError("Failed to submit leave request");
   }
  setSubmittingLeave(false);
 };

 const handleCancelLeave = async (leaveId) => {
  try {
   const res = await authFetch(`${API_BASE_URL}/leaves/${leaveId}/${user._id}`, {
    method: "DELETE",
   });
   if (res.ok) fetchLeaves();
  } catch {}
 };

 const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  declined: "bg-red-100 text-red-700",
 };

 // If student is discontinued, show locked dashboard
 if (userData?.isDiscontinued) {
  return (
   <div className="space-y-8">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
     <div>
      <h2 className="text-3xl font-bold">Hello, {user?.username?.split(" ")[0] || "Learner"}!</h2>
      <p className="text-zinc-500 mt-1">Your account has been discontinued.</p>
     </div>
    </div>

    <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-12 text-center">
     <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <AlertCircle className="w-10 h-10 text-red-600" />
     </div>
     <h3 className="text-xl font-bold mb-2">Account Discontinued</h3>
      <p className="text-zinc-500 mb-4">
       Your account has been discontinued by an administrator.
      </p>
      {userData?.discontinuationReason && (
       <p className="text-sm text-red-600 font-medium mb-4">
        Reason: {userData.discontinuationReason}
       </p>
      )}
      <p className="text-sm text-zinc-400">
       Please contact your administrator to reactivate your account.
      </p>
    </div>
   </div>
  );
 }

 // If approved leave is active, show locked dashboard
 if (activeLeave) {
  const start = new Date(activeLeave.startDate).toLocaleDateString();
  const end = new Date(activeLeave.endDate).toLocaleDateString();
  return (
   <div className="space-y-8">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
     <div>
      <h2 className="text-3xl font-bold">Hello, {user?.username?.split(" ")[0] || "Learner"}!</h2>
      <p className="text-zinc-500 mt-1">Your dashboard is currently locked.</p>
     </div>
    </div>

    <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-12 text-center">
     <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <CalendarOff className="w-10 h-10 text-amber-600" />
     </div>
     <h3 className="text-xl font-bold mb-2">On Approved Leave</h3>
     <p className="text-zinc-500 mb-4">
      Your leave is active from <strong>{start}</strong> to <strong>{end}</strong>.
     </p>
     <p className="text-sm text-zinc-400">
      Course access will resume after your leave period ends.
     </p>
    </div>

    {/* My Leaves */}
    {leaves.length > 0 && (
     <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
      <h3 className="text-lg font-bold mb-4">My Leave History</h3>
      <div className="space-y-3">
       {leaves.map((leave) => (
        <div key={leave._id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-100">
         <div>
          <p className="text-sm font-medium">{leave.reason}</p>
          <p className="text-xs text-zinc-500">
           {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}
          </p>
         </div>
         <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusColors[leave.status]}`}>
          {leave.status}
         </span>
        </div>
       ))}
      </div>
     </div>
    )}
   </div>
  );
 }

 return (
  <div className="space-y-8">
   {/* HEADER */}
   <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
     <h2 className="text-3xl font-bold">
      Hello, {user?.username?.split(" ")[0] || "Learner"}!
     </h2>
     <p className="text-zinc-500 mt-1">
      Ready to continue your learning journey?
     </p>
    </div>
    <div className="flex gap-3">
     <button
      onClick={() => setShowLeaveForm(true)}
      className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition font-medium"
     >
      <Plus className="w-4 h-4" />
      Apply Leave
     </button>
     <a
      href="https://master2013.com/"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition"
     >
      <ExternalLink className="w-4 h-4" />
      Assignments
     </a>
    </div>
    </div>

    {/* NOTICES */}
    {notices.length > 0 && (
     <div className="space-y-3">
      <div className="flex items-center justify-between">
       <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold text-zinc-800">Latest Notices</h3>
       </div>
       <Link to="/student/notices" className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition">
        View All <ChevronRight className="w-4 h-4" />
       </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
       {notices.map(notice => (
        <Link
         key={notice._id}
         to="/student/notices"
         className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 hover:shadow-md hover:border-amber-200 transition-all"
        >
         {(notice.mediaType !== "none") && (notice.mediaUrl || notice.mediaBase64) && (
          <div className="mb-3 rounded-xl overflow-hidden">
           {notice.mediaType === "image" ? (
            <img src={notice.mediaBase64 || notice.mediaUrl} alt={notice.title} className="w-full h-32 object-cover" />
           ) : (
            <div className="w-full h-32 bg-zinc-100 flex items-center justify-center">
             <Video className="w-8 h-8 text-zinc-400" />
            </div>
           )}
          </div>
         )}
         <h4 className="font-semibold text-zinc-900 text-sm line-clamp-1">{notice.title}</h4>
         {notice.caption && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{notice.caption}</p>}
         <p className="text-xs text-zinc-400 mt-2">
          {new Date(notice.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
         </p>
        </Link>
       ))}
      </div>
     </div>
    )}

    {/* COURSE GRID */}
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {isLoading ? (
     [1, 2, 3].map((i) => (
      <div key={i} className="h-64 bg-zinc-200 rounded-3xl animate-pulse" />
     ))
    ) : courses.length > 0 ? (
     courses.map((course) => {
      const isCourseCompleted = course.progress === 100;

      return (
       <Link
        key={course._id}
        to={`/student/course/${course._id}`}
        className={`group bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm transition-all ${
         isCourseCompleted
          ? "opacity-80"
          : "hover:shadow-xl hover:-translate-y-1"
        }`}
       >
        <div className="flex justify-between items-start mb-6">
         <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 group-hover:scale-110 transition">
          <BookOpen className="w-6 h-6" />
         </div>
         <div className="flex flex-col items-end gap-2">
          {isCourseCompleted && (
           <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold flex items-center">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
           </div>
          )}
          {course.isOverdue && (
           <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            Overdue
           </div>
          )}
         </div>
        </div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-violet-600 transition">
         {course.course_name}
        </h3>
        <p className="text-sm text-zinc-500 line-clamp-2 mb-6">
         {course.course_description}
        </p>
        <div className="space-y-4">
         <div className="flex justify-between text-xs font-medium">
          <span className="text-zinc-500">Progress</span>
          <span>{course.progress || 0}%</span>
         </div>
         <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div style={{ width: `${course.progress}%` }} className="bg-blue-600 h-2 transition-all duration-500" />
         </div>
        </div>
        <div className="mt-6 pt-6 border-t flex items-center justify-between">
         <div className="flex items-center text-sm text-zinc-500">
          <Clock className="w-4 h-4 mr-2" />
          {course.modules?.length || 0} Modules
         </div>
         {isCourseCompleted ? (
          <span className="flex items-center text-emerald-600 font-semibold text-sm">
           View Only
          </span>
         ) : (
          <div className="flex items-center text-violet-600 font-semibold text-sm">
           Continue
           <ArrowRight className="ml-2 w-4 h-4" />
          </div>
         )}
        </div>
       </Link>
      );
     })
    ) : (
     <div className="col-span-full py-20 text-center">
      <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
       <BookOpen className="w-10 h-10 text-zinc-400" />
      </div>
      <h3 className="text-xl font-bold mb-2">No courses enrolled</h3>
      <p className="text-zinc-500">You haven't been enrolled in any courses yet.</p>
     </div>
    )}
   </div>

   {/* MY LEAVES */}
   {leaves.length > 0 && (
    <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
     <h3 className="text-lg font-bold mb-4">My Leave Requests</h3>
     <div className="space-y-3">
      {leaves.map((leave) => (
       <div key={leave._id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-100">
        <div className="flex-1">
         <p className="text-sm font-medium">{leave.reason}</p>
         <p className="text-xs text-zinc-500">
          {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}
         </p>
         {leave.reviewedAt && (
          <p className="text-xs text-zinc-400 mt-1">
           Reviewed on {new Date(leave.reviewedAt).toLocaleDateString()}
          </p>
         )}
        </div>
        <div className="flex items-center gap-3">
         <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusColors[leave.status]}`}>
          {leave.status}
         </span>
         {leave.status === "pending" && (
          <button
           onClick={() => handleCancelLeave(leave._id)}
           className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
           title="Cancel"
          >
           <X className="w-4 h-4" />
          </button>
         )}
        </div>
       </div>
      ))}
     </div>
    </div>
   )}

   {/* LEAVE APPLICATION MODAL */}
   {showLeaveForm && (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
     <div className="bg-white p-8 rounded-2xl w-96 space-y-4 border border-zinc-200 shadow-2xl">
      <div className="flex justify-between items-center">
       <h2 className="text-xl font-bold">Apply for Leave</h2>
       <button onClick={() => { setShowLeaveForm(false); setLeaveError(""); }} className="text-zinc-400 hover:text-zinc-600 transition">
        <X className="w-5 h-5" />
       </button>
      </div>

      <textarea
       placeholder="Reason for leave..."
       rows={3}
       value={leaveForm.reason}
       onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
       className="w-full border border-zinc-200 bg-zinc-50 p-3 rounded-lg text-zinc-900 focus:ring-2 focus:ring-amber-600 outline-none transition resize-none"
      />

      <div className="grid grid-cols-2 gap-3">
       <div>
        <label className="text-xs font-medium text-zinc-500 mb-1 block">Start Date</label>
        <input
         type="date"
         min={today}
         value={leaveForm.startDate}
         onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
         className="w-full border border-zinc-200 bg-zinc-50 p-3 rounded-lg text-zinc-900 focus:ring-2 focus:ring-amber-600 outline-none transition"
        />
       </div>
       <div>
        <label className="text-xs font-medium text-zinc-500 mb-1 block">End Date</label>
        <input
         type="date"
         min={leaveForm.startDate || today}
         value={leaveForm.endDate}
         onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
         className="w-full border border-zinc-200 bg-zinc-50 p-3 rounded-lg text-zinc-900 focus:ring-2 focus:ring-amber-600 outline-none transition"
        />
       </div>
      </div>

      {leaveError && (
       <p className="text-red-600 text-sm font-medium">{leaveError}</p>
      )}

      <button
       onClick={handleSubmitLeave}
       disabled={submittingLeave}
       className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-3 rounded-xl transition font-medium"
      >
       {submittingLeave ? "Submitting..." : "Submit Leave Request"}
      </button>
     </div>
    </div>
   )}
  </div>
 );
}
