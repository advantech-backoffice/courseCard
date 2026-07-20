import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X, Calendar, User } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { useAuth } from '../context/AuthContext';

export default function AdminLeave() {
 const { user, authFetch } = useAuth();
 const [leaves, setLeaves] = useState([]);
 const [isLoading, setIsLoading] = useState(true);
 const [toast, setToast] = useState(null);

 const showToast = (type, message) => {
  setToast({ type, message });
  setTimeout(() => setToast(null), 4000);
 };

 const fetchLeaves = async () => {
  try {
   const res = await authFetch(`${API_BASE_URL}/leaves`);
   const data = await res.json();
   setLeaves(Array.isArray(data) ? data : []);
  } catch {
   showToast('error', 'Failed to load leave requests');
  }
  setIsLoading(false);
 };

 useEffect(() => {
  fetchLeaves();
 }, [authFetch]);

 const handleReview = async (leaveId, status) => {
  try {
   const res = await authFetch(`${API_BASE_URL}/leaves/${leaveId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, reviewedBy: user._id }),
   });
   if (res.ok) {
    showToast('success', `Leave ${status}`);
    fetchLeaves();
   } else {
    const data = await res.json();
    showToast('error', data.message || 'Failed to update leave');
   }
  } catch {
   showToast('error', 'Failed to update leave');
  }
 };

 const statusColors = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  declined: 'bg-red-100 text-red-700 border-red-200',
 };

 const pendingLeaves = leaves.filter((l) => l.status === 'pending');
 const reviewedLeaves = leaves.filter((l) => l.status !== 'pending');

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

   <h2 className="text-2xl font-bold">Leave Requests</h2>

   {/* Pending */}
   <div>
    <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-3">Pending ({pendingLeaves.length})</h3>
    {isLoading ? (
     <div className="h-32 bg-zinc-200 rounded-2xl animate-pulse" />
    ) : pendingLeaves.length === 0 ? (
     <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center text-zinc-500">
      No pending leave requests
     </div>
    ) : (
     <div className="space-y-3">
      {pendingLeaves.map((leave) => (
       <div key={leave._id} className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
         <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
           <User className="w-4 h-4 text-zinc-400" />
           <span className="font-semibold">{leave.student?.username || "Unknown"}</span>
           <span className="text-sm text-zinc-500">{leave.student?.email}</span>
          </div>
          <p className="text-sm text-zinc-700 mb-2">{leave.reason}</p>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
           <Calendar className="w-3.5 h-3.5" />
           {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}
          </div>
         </div>
         <div className="flex gap-2">
          <button
           onClick={() => handleReview(leave._id, 'approved')}
           className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-xl transition font-medium"
          >
           Approve
          </button>
          <button
           onClick={() => handleReview(leave._id, 'declined')}
           className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-xl transition font-medium"
          >
           Decline
          </button>
         </div>
        </div>
       </div>
      ))}
     </div>
    )}
   </div>

   {/* Reviewed */}
   <div>
    <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-3">Reviewed ({reviewedLeaves.length})</h3>
    {reviewedLeaves.length === 0 ? (
     <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center text-zinc-500">
      No reviewed leaves yet
     </div>
    ) : (
     <div className="space-y-3">
      {reviewedLeaves.map((leave) => (
       <div key={leave._id} className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm opacity-75">
        <div className="flex items-start justify-between gap-4">
         <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
           <User className="w-4 h-4 text-zinc-400" />
           <span className="font-semibold">{leave.student?.username || "Unknown"}</span>
           <span className="text-sm text-zinc-500">{leave.student?.email}</span>
          </div>
          <p className="text-sm text-zinc-700 mb-2">{leave.reason}</p>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
           <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}
           </div>
           {leave.reviewedAt && (
            <span>Reviewed {new Date(leave.reviewedAt).toLocaleDateString()}</span>
           )}
          </div>
         </div>
         <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize border ${statusColors[leave.status]}`}>
          {leave.status}
         </span>
        </div>
       </div>
      ))}
     </div>
    )}
   </div>
  </div>
 );
}
