import { useEffect, useState, useMemo } from "react";
import {
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Users,
  BookOpen,
  Search,
  Filter,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { API_BASE_URL } from "../constants";

function downloadExcel(headers, rows, filename) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function downloadPDF(title, headers, rows, filename) {
  const doc = new jsPDF("l", "mm", "a4");
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
  doc.autoTable({
    startY: 28,
    head: [headers],
    body: rows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [79, 70, 229] },
  });
  doc.save(`${filename}.pdf`);
}

function ReportSection({ title, subtitle, icon: Icon, children, onExcel, onPdf }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {open && (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={onExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Excel
              </button>
              <button
                onClick={onPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                PDF
              </button>
            </div>
          )}
          {open ? (
            <ChevronUp className="w-5 h-5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-400" />
          )}
        </div>
      </div>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

const SELECT_CLASSES = "px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none transition";

export default function AdminReports() {
  const [dailyReport, setDailyReport] = useState(null);
  const [todayActivity, setTodayActivity] = useState(null);
  const [facultyDaily, setFacultyDaily] = useState(null);
  const [overallActivity, setOverallActivity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");

  useEffect(() => {
    async function fetchAll() {
      try {
        const [dRes, tRes, fRes, oRes] = await Promise.all([
          fetch(`${API_BASE_URL}/stats/daily-report`),
          fetch(`${API_BASE_URL}/stats/today-activity`),
          fetch(`${API_BASE_URL}/stats/faculty-daily`),
          fetch(`${API_BASE_URL}/stats/student-overall-activity`),
        ]);
        const [d, t, f, o] = await Promise.all([
          dRes.json(),
          tRes.json(),
          fRes.json(),
          oRes.json(),
        ]);
        setDailyReport(d.data);
        setTodayActivity(t.data);
        setFacultyDaily(f.data);
        setOverallActivity(o.data);
      } catch (err) {
        setError("Failed to load reports");
      }
      setIsLoading(false);
    }
    fetchAll();
  }, []);

  const searchLower = search.toLowerCase();

  const matchesSearch = (name, email) => {
    if (!searchLower) return true;
    return (
      (name && name.toLowerCase().includes(searchLower)) ||
      (email && email.toLowerCase().includes(searchLower))
    );
  };

  const courses = useMemo(() => {
    const set = new Set();
    todayActivity?.activities?.forEach((a) => a.course && set.add(a.course));
    overallActivity?.forEach((s) => s.activities?.forEach((a) => a.course && set.add(a.course)));
    return [...set].sort();
  }, [todayActivity, overallActivity]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCourseFilter("all");
    setActivityFilter("all");
  };

  const hasActiveFilters = search || statusFilter !== "all" || courseFilter !== "all" || activityFilter !== "all";

  if (isLoading)
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="text-zinc-500 text-sm mt-1">Loading reports...</p>
        </div>
        <div className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />
        <div className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />
      </div>
    );

  if (error)
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="text-zinc-500 text-sm mt-1">Download student reports as Excel or PDF</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-3xl p-8 text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      </div>
    );

  // ===== REPORT 1: Daily Attendance (filtered) =====
  const r1Headers = ["Name", "Email", "Status", "Activity Type", "Time"];
  const r1Present = (dailyReport?.present || []).filter(
    (s) =>
      matchesSearch(s.username, s.email) &&
      (statusFilter === "all" || statusFilter === "present")
  );
  const r1Absent = (dailyReport?.absent || []).filter(
    (s) =>
      matchesSearch(s.username, s.email) &&
      (statusFilter === "all" || statusFilter === "absent")
  );
  const r1Rows = [
    ...r1Present.map((s) => [
      s.username,
      s.email,
      "Present",
      s.activityType,
      new Date(s.completedAt).toLocaleTimeString(),
    ]),
    ...r1Absent.map((s) => [s.username, s.email, "Absent", "-", "-"]),
  ];

  // ===== REPORT 2: Today's Activity (filtered) =====
  const r2Headers = ["Name", "Email", "Course", "Topic", "Activity Type", "Time"];
  const r2Rows = (todayActivity?.activities || [])
    .filter(
      (a) =>
        matchesSearch(a.username, a.email) &&
        (courseFilter === "all" || a.course === courseFilter) &&
        (activityFilter === "all" || a.activityType === activityFilter)
    )
    .map((a) => [
      a.username,
      a.email,
      a.course,
      a.topic,
      a.activityType,
      new Date(a.completedAt).toLocaleTimeString(),
    ]);

  // ===== REPORT 3: Faculty-wise (filtered) =====
  const r3Headers = ["Faculty", "Student", "Email", "Status", "Course", "Topic", "Activity Type", "Time"];
  const r3Faculty = (facultyDaily?.faculty || [])
    .map((f) => ({
      ...f,
      students: f.students.filter(
        (s) =>
          matchesSearch(s.username, s.email) &&
          matchesSearch(f.teacherName, "") &&
          (statusFilter === "all" || s.status.toLowerCase() === statusFilter) &&
          (activityFilter === "all" || s.activityType === activityFilter)
      ),
    }))
    .filter((f) => f.students.length > 0);
  const r3Rows = [];
  r3Faculty.forEach((f) => {
    f.students.forEach((s) =>
      r3Rows.push([
        f.teacherName,
        s.username,
        s.email,
        s.status,
        s.course,
        s.topic,
        s.activityType,
        s.completedAt ? new Date(s.completedAt).toLocaleTimeString() : "-",
      ])
    );
  });

  // ===== REPORT 4: Overall Activity (filtered) =====
  const r4Headers = ["Name", "Email", "Course", "Topic", "Activity Type", "Date"];
  const r4Students = (overallActivity || [])
    .map((s) => ({
      ...s,
      activities: s.activities.filter(
        (a) =>
          matchesSearch(s.username, s.email) &&
          (courseFilter === "all" || a.course === courseFilter) &&
          (activityFilter === "all" || a.activityType === activityFilter)
      ),
    }))
    .filter((s) => s.activities.length > 0);
  const r4Rows = [];
  r4Students.forEach((s) => {
    s.activities.forEach((a) =>
      r4Rows.push([
        s.username,
        s.email,
        a.course,
        a.topic,
        a.activityType,
        new Date(a.completedAt).toLocaleDateString(),
      ])
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="text-zinc-500 text-sm mt-1">Download student reports as Excel or PDF</p>
        </div>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
            <Filter className="w-4 h-4" />
            Filters
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-0 w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none transition"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={SELECT_CLASSES}
          >
            <option value="all">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>

          {/* Course Filter */}
          {courses.length > 0 && (
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className={SELECT_CLASSES}
            >
              <option value="all">All Courses</option>
              {courses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Activity Type Filter */}
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className={SELECT_CLASSES}
          >
            <option value="all">All Activity Types</option>
            <option value="lecture">Lecture</option>
            <option value="assignment">Assignment</option>
            <option value="practice">Practice</option>
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 rounded-xl transition"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Report 1: Daily Attendance */}
      <ReportSection
        title={`Student Daily Attendance${dailyReport ? ` (${dailyReport.date})` : ""}`}
        subtitle={`Showing ${r1Rows.length} of ${(dailyReport?.presentCount || 0) + (dailyReport?.absentCount || 0)} students`}
        icon={Users}
        onExcel={() => downloadExcel(r1Headers, r1Rows, "daily-attendance")}
        onPdf={() => downloadPDF("Student Daily Attendance", r1Headers, r1Rows, "daily-attendance")}
      >
        {dailyReport && (
          <div className="mb-4 flex gap-4 text-sm">
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle className="w-4 h-4" /> Present: {r1Present.length}
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <XCircle className="w-4 h-4" /> Absent: {r1Absent.length}
            </span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-zinc-700">
                {r1Headers.map((h) => (
                  <th key={h} className="text-left p-3 font-medium text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r1Rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-zinc-500 text-center">
                    No matching records
                  </td>
                </tr>
              ) : (
                r1Rows.map((row, i) => (
                  <tr key={i} className="border-b dark:border-zinc-800">
                    {row.map((cell, j) => (
                      <td key={j} className="p-3">
                        {j === 2 ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              cell === "Present"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {cell}
                          </span>
                        ) : j === 3 && cell !== "-" ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                            {cell}
                          </span>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* Report 2: Today's Activity */}
      <ReportSection
        title={`Today's Activity`}
        subtitle={`Showing ${r2Rows.length} of ${todayActivity?.count || 0} activities`}
        icon={BookOpen}
        onExcel={() => downloadExcel(r2Headers, r2Rows, "today-activity")}
        onPdf={() => downloadPDF("Student Today's Activity", r2Headers, r2Rows, "today-activity")}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-zinc-700">
                {r2Headers.map((h) => (
                  <th key={h} className="text-left p-3 font-medium text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r2Rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-zinc-500 text-center">
                    No matching activity
                  </td>
                </tr>
              ) : (
                r2Rows.map((row, i) => (
                  <tr key={i} className="border-b dark:border-zinc-800">
                    {row.map((cell, j) => (
                      <td key={j} className="p-3">
                        {j === 4 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                            {cell}
                          </span>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* Report 3: Faculty-wise Daily */}
      <ReportSection
        title="Faculty-wise Student Daily Record"
        subtitle={`Showing ${r3Rows.length} students across ${r3Faculty.length} faculties`}
        icon={Users}
        onExcel={() => downloadExcel(r3Headers, r3Rows, "faculty-daily-record")}
        onPdf={() => downloadPDF("Faculty-wise Student Daily Record", r3Headers, r3Rows, "faculty-daily-record")}
      >
        <div className="space-y-6">
          {r3Faculty.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center">No matching records</p>
          ) : (
            r3Faculty.map((f) => (
              <div key={f.teacherId}>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold">{f.teacherName}</h4>
                  <span className="text-xs text-zinc-500">
                    ({f.students.filter((s) => s.status === "Present").length} present /{" "}
                    {f.students.filter((s) => s.status === "Absent").length} absent)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b dark:border-zinc-700">
                        <th className="text-left p-2 font-medium text-zinc-500">Student</th>
                        <th className="text-left p-2 font-medium text-zinc-500">Status</th>
                        <th className="text-left p-2 font-medium text-zinc-500">Course</th>
                        <th className="text-left p-2 font-medium text-zinc-500">Topic</th>
                        <th className="text-left p-2 font-medium text-zinc-500">Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {f.students.map((s, i) => (
                        <tr key={i} className="border-b dark:border-zinc-800">
                          <td className="p-2">{s.username}</td>
                          <td className="p-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                s.status === "Present"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {s.status}
                            </span>
                          </td>
                          <td className="p-2">{s.course}</td>
                          <td className="p-2">{s.topic}</td>
                          <td className="p-2">
                            {s.activityType !== "-" ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                                {s.activityType}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </ReportSection>

      {/* Report 4: Overall Activity */}
      <ReportSection
        title="Student Overall Activity Report"
        subtitle={`Showing ${r4Students.length} students with ${r4Rows.length} total activities`}
        icon={FileText}
        onExcel={() => downloadExcel(r4Headers, r4Rows, "student-overall-activity")}
        onPdf={() => downloadPDF("Student Overall Activity Report", r4Headers, r4Rows, "student-overall-activity")}
      >
        <div className="space-y-4">
          {r4Students.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center">No matching activity</p>
          ) : (
            r4Students.map((s) => (
              <div
                key={s.username}
                className="border dark:border-zinc-800 rounded-xl overflow-hidden"
              >
                <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50">
                  <div>
                    <span className="font-medium">{s.username}</span>
                    <span className="text-xs text-zinc-500 ml-2">{s.email}</span>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {s.activities.length} activities
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-zinc-800">
                      <th className="text-left p-2 font-medium text-zinc-500">Course</th>
                      <th className="text-left p-2 font-medium text-zinc-500">Topic</th>
                      <th className="text-left p-2 font-medium text-zinc-500">Activity</th>
                      <th className="text-left p-2 font-medium text-zinc-500">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.activities.map((a, i) => (
                      <tr key={i} className="border-b dark:border-zinc-800 last:border-0">
                        <td className="p-2">{a.course}</td>
                        <td className="p-2">{a.topic}</td>
                        <td className="p-2">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                            {a.activityType}
                          </span>
                        </td>
                        <td className="p-2 text-zinc-500">
                          {new Date(a.completedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </ReportSection>
    </div>
  );
}
