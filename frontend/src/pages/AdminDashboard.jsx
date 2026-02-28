import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
  ArrowUpRight,
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

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [popularCourses, setPopularCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, trendRes, popularRes, recentRes] = await Promise.all([
          fetch(`${API_BASE_URL}/stats`),
          fetch(`${API_BASE_URL}/stats/enrollment-trend`),
          fetch(`${API_BASE_URL}/stats/popular-courses`),
          fetch(`${API_BASE_URL}/stats/recent-signups`),
        ]);

        const statsData = await statsRes.json();
        const trendJson = await trendRes.json();
        const popularJson = await popularRes.json();
        const recentJson = await recentRes.json();
        setRecentUsers(recentJson.data);
        setStats(statsData.data);

        // 🔥 Format trend for chart
        const formattedTrend = trendJson.data.map((item) => ({
          name: `${item.month}/${item.year}`,
          enrollments: item.enrollments,
        }));

        setTrendData(formattedTrend);

        // 🔥 Format popular courses
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

  if (isLoading) return <div className="text-center">Loading dashboard...</div>;

  const cards = [
    { label: "Total Users", value: stats?.users, icon: Users, color: "indigo" },
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
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
          >
            <div
              className={`p-3 bg-${card.color}-50 dark:bg-${card.color}-900/20 rounded-2xl w-fit mb-4`}
            >
              <card.icon className={`w-6 h-6 text-${card.color}-600`} />
            </div>

            <p className="text-sm text-zinc-500">{card.label}</p>
            <h3 className="text-2xl font-bold">{card.value}</h3>
          </div>
        ))}
      </div>

      {/* ===== CHARTS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ===== ENROLLMENT TREND ===== */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border shadow-sm">
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
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border shadow-sm">
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
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
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
                className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl"
              >
                <div>
                  <p className="font-semibold">{user.username}</p>
                  <p className="text-sm text-zinc-500">{user.email}</p>
                </div>

                <div className="text-right">
                  <span className="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 capitalize">
                    {user.role}
                  </span>
                  <p className="text-xs text-zinc-400 mt-1">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
