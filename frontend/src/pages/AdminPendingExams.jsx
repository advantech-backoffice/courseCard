import { useEffect, useState } from "react";
import { ClipboardList, Download, Search } from "lucide-react";
import { API_BASE_URL } from "../constants";

export default function AdminPendingExams() {
 const [pendingExams, setPendingExams] = useState([]);
 const [isLoading, setIsLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState("");
 const [markingIds, setMarkingIds] = useState(new Set());

 useEffect(() => {
 async function fetchData() {
 try {
 const res = await fetch(`${API_BASE_URL}/stats/exam-status`);
 const data = await res.json();
 if (data.success) {
 setPendingExams(data.pendingExams);
 }
 } catch (err) {
 console.error(err);
 }
 setIsLoading(false);
 }
 fetchData();
 }, []);

 const markExamDone = async (userId, courseId) => {
 const key = `${userId}-${courseId}`;
 if (markingIds.has(key)) return;
 setMarkingIds(prev => new Set([...prev, key]));

 try {
 const res = await fetch(`${API_BASE_URL}/stats/mark-exam-done`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ userId, courseId })
 });
 const data = await res.json();
 if (data.success) {
 setPendingExams(prev => prev.filter(e => !(e.userId === userId && e.courseId === courseId)));
 }
 } catch (err) {
 console.error(err);
 }
 setMarkingIds(prev => {
 const next = new Set(prev);
 next.delete(key);
 return next;
 });
 };

 const handleExport = () => {
 window.open(`${API_BASE_URL}/stats/pending-exams/export`, '_blank');
 };

 if (isLoading) return <div className="text-center">Loading pending exams...</div>;

 return (
 <div className="space-y-8">
 <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h3 className="text-lg font-bold flex items-center">
 <ClipboardList className="w-5 h-5 mr-2 text-amber-500" />
 Pending Exams
 </h3>
 <p className="text-sm text-zinc-500">
 Students who completed courses but exams are pending
 </p>
 </div>
 <button
 onClick={handleExport}
 className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center"
 >
 <Download className="w-4 h-4 mr-2" />
 Export to Excel
 </button>
 </div>

 <div className="mb-6 relative">
 <Search className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
 <input
 type="text"
 placeholder="Search by student name or course..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-10 pr-4 py-2 border border-zinc-200 bg-zinc-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
 />
 </div>
 
 <div className="space-y-4">
 {pendingExams.filter(exam => 
 exam.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
 exam.course_name.toLowerCase().includes(searchQuery.toLowerCase())
 ).length === 0 ? (
 <p className="text-zinc-500 text-sm">No pending exams found.</p>
 ) : (
 pendingExams.filter(exam => 
 exam.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
 exam.course_name.toLowerCase().includes(searchQuery.toLowerCase())
 ).map((exam, idx) => (
 <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
 <div>
 <div className="flex items-center gap-2">
  <p className="font-semibold">{exam.username}</p>
  {exam.isDiscontinued && (
   <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-bold" title={exam.discontinuationReason || "No reason provided"}>Discontinued{exam.discontinuationReason ? `: ${exam.discontinuationReason}` : ""}</span>
  )}
 </div>
 <p className="text-xs text-zinc-500">{exam.course_name}</p>
 </div>
 <button
 onClick={() => markExamDone(exam.userId, exam.courseId)}
 disabled={markingIds.has(`${exam.userId}-${exam.courseId}`)}
 className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
 >
 {markingIds.has(`${exam.userId}-${exam.courseId}`) ? "Marking..." : "Mark Done"}
 </button>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 );
}
