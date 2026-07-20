import { useEffect, useState } from "react";
import {
 Users,
 UserCheck,
 GraduationCap,
 BookOpen,
 ArrowUpRight,
 CheckCircle,
 XCircle,
} from "lucide-react";

import {
 BarChart,
 Bar,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 AreaChart,
 Area,
} from "recharts";

import { API_BASE_URL } from "../constants";

const CARD_COLORS = {
 blue: { bg: 'bg-blue-50', darkBg: '', text: 'text-blue-600' },
 violet: { bg: 'bg-violet-50', darkBg: '', text: 'text-violet-600' },
 emerald: { bg: 'bg-emerald-50', darkBg: '', text: 'text-emerald-600' },
 amber: { bg: 'bg-amber-50', darkBg: '', text: 'text-amber-600' },
};

export default function AdminDashboard() {
 const [stats, setStats] = useState(null);
 const [trendData, setTrendData] = useState([]);
 const [popularCourses, setPopularCourses] = useState([]);
 const [isLoading, setIsLoading] = useState(true);
 const [recentUsers, setRecentUsers] = useState([]);
 const [dailyReport, setDailyReport] = useState(null);

 useEffect(() => {
 async function fetchData() {
 try {
 const [statsRes, trendRes, popularRes, recentRes, dailyRes] = await Promise.all([
 fetch(`${API_BASE_URL}/stats`),
 fetch(`${API_BASE_URL}/stats/enrollment-trend`),
 fetch(`${API_BASE_URL}/stats/popular-courses`),
 fetch(`${API_BASE_URL}/stats/recent-signups`),
 fetch(`${API_BASE_URL}/stats/daily-report`),
 ]);

 const statsData = await statsRes.json();
 const trendJson = await trendRes.json();
 const popularJson = await popularRes.json();
 const recentJson = await recentRes.json();
 const dailyJson = await dailyRes.json();
 setRecentUsers(recentJson.data);
 setStats(statsData.data);
 setDailyReport(dailyJson.data);

 const formattedTrend = trendJson.data.map((item) => ({
 name: `${item.month}/${item.year}`,
 enrollments: item.enrollments,
 }));

 setTrendData(formattedTrend);

 const formattedPopular = popularJson.data.map((c) => ({
 name: c.course_name,
 students: c.enrollmentCount,
 }));

 setPopularCourses(formattedPopular);
 } catch (err) {
 console.error(err);
 }

 setIsLoading(false);
 }

 fetchData();
 }, []);

 if (isLoading) return (
 <div className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {[1,2,3,4].map(i => <div key={i} className="h-32 bg-zinc-200 rounded-3xl animate-pulse" />)}
 </div>
 </div>
 );

 const cards = [
 { label: "Total Users", value: stats?.users, icon: Users, color: "blue" },
 {
 label: "Students",
 value: stats?.students,
 icon: GraduationCap,
 color: "violet",
 },
 {
 label: "Teachers",
 value: stats?.teachers,
 icon: UserCheck,
 color: "emerald",
 },
 { label: "Courses", value: stats?.courses, icon: BookOpen, color: "amber" },
 ];

 return (
 <div className="space-y-8">
 {/* ===== STATS CARDS ===== */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {cards.map((card) => {
 const colors = CARD_COLORS[card.color] || CARD_COLORS.blue;
 return (
 <div
 key={card.label}
 className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm"
 >
 <div className={`p-3 ${colors.bg} ${colors.darkBg} rounded-2xl w-fit mb-4`}>
 <card.icon className={`w-6 h-6 ${colors.text}`} />
 </div>

 <p className="text-sm text-zinc-500">{card.label}</p>
 <h3 className="text-2xl font-bold">{card.value}</h3>
 </div>
 );
 })}
 </div>

 {/* ===== CHARTS ===== */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {/* ===== ENROLLMENT TREND ===== */}
 <div className="bg-white p-8 rounded-3xl border shadow-sm">
 <div className="flex justify-between mb-6">
 <div>
 <h3 className="text-lg font-bold">Enrollment Trend</h3>
 <p className="text-sm text-zinc-500">
 Monthly student enrollments
 </p>
 </div>
 <ArrowUpRight className="text-zinc-400" />
 </div>

 <div className="h-72">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={trendData}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} />
 <XAxis dataKey="name" />
 <YAxis />
 <Tooltip />

 <Area
 type="monotone"
 dataKey="enrollments"
 stroke="#4f46e5"
 fill="#4f46e5"
 fillOpacity={0.2}
 strokeWidth={3}
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* ===== POPULAR COURSES ===== */}
 <div className="bg-white p-8 rounded-3xl border shadow-sm">
 <div className="flex justify-between mb-6">
 <div>
 <h3 className="text-lg font-bold">Popular Courses</h3>
 <p className="text-sm text-zinc-500">Top enrolled courses</p>
 </div>
 <ArrowUpRight className="text-zinc-400" />
 </div>

 <div className="h-72">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={popularCourses}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} />
 <XAxis dataKey="name" />
 <YAxis />
 <Tooltip />

 <Bar
 dataKey="students"
 fill="#10b981"
 radius={[6, 6, 0, 0]}
 barSize={40}
 />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>
 
 {/* ===== RECENT SIGNUPS ===== */}
 <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h3 className="text-lg font-bold">Recent Signups</h3>
 <p className="text-sm text-zinc-500">
 Newest users on the platform
 </p>
 </div>
 </div>

 <div className="space-y-4">
 {recentUsers.map((user) => (
 <div
 key={user._id}
 className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl"
 >
 <div>
 <p className="font-semibold">{user.username}</p>
 <p className="text-sm text-zinc-500">{user.email}</p>
 </div>

 <div className="text-right">
  <div className="flex items-center gap-2 justify-end">
    {user.isDiscontinued && (
     <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-bold" title={user.discontinuationReason || "No reason provided"}>Discontinued{user.discontinuationReason ? `: ${user.discontinuationReason}` : ""}</span>
    )}
   <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-600 capitalize">
    {user.role}
   </span>
  </div>
  <p className="text-xs text-zinc-400 mt-1">
   {new Date(user.createdAt).toLocaleDateString()}
  </p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* ===== DAILY ATTENDANCE REPORT ===== */}
 {dailyReport && (
 <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h3 className="text-lg font-bold">Daily Attendance Report</h3>
 <p className="text-sm text-zinc-500">
 {dailyReport.date} — {dailyReport.presentCount} present, {dailyReport.absentCount} absent
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {/* PRESENT */}
 <div>
 <div className="flex items-center gap-2 mb-4">
 <CheckCircle className="w-5 h-5 text-emerald-500" />
 <h4 className="font-bold text-emerald-600">Present ({dailyReport.presentCount})</h4>
 </div>
 <div className="space-y-2">
 {dailyReport.present.length === 0 ? (
 <p className="text-sm text-zinc-500">No students active today</p>
 ) : (
 dailyReport.present.map((s) => (
 <div key={s._id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
 <div>
 <p className="font-medium text-sm">{s.username}</p>
 <p className="text-xs text-zinc-500">{s.email}</p>
 </div>
 <div className="text-right">
 <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 capitalize font-medium">
 {s.activityType}
 </span>
 <p className="text-[10px] text-zinc-400 mt-1">
 {new Date(s.completedAt).toLocaleTimeString()}
 </p>
 </div>
 </div>
 ))
 )}
 </div>
 </div>

 {/* ABSENT */}
 <div>
 <div className="flex items-center gap-2 mb-4">
 <XCircle className="w-5 h-5 text-red-500" />
 <h4 className="font-bold text-red-600">Absent ({dailyReport.absentCount})</h4>
 </div>
 <div className="space-y-2">
 {dailyReport.absent.length === 0 ? (
 <p className="text-sm text-zinc-500">All students are active today</p>
 ) : (
 dailyReport.absent.map((s) => (
 <div key={s._id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
 <div>
 <p className="font-medium text-sm">{s.username}</p>
 <p className="text-xs text-zinc-500">{s.email}</p>
 </div>
 <span className="text-xs text-red-500 font-medium">No activity</span>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
