import { useEffect, useState } from "react";
import { CheckCircle, Search, Calendar } from "lucide-react";
import { API_BASE_URL } from "../constants";

export default function AdminCompletedExams() {
  const [completedExams, setCompletedExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_BASE_URL}/stats/exam-status`);
        const data = await res.json();
        if (data.success) {
          setCompletedExams(data.completedExams);
        }
      } catch (err) {
        console.error(err);
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);

  if (isLoading) return <div className="text-center">Loading completed exams...</div>;

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" />
              Completed Exams
            </h3>
            <p className="text-sm text-zinc-500">
              Students whose exams have been marked as done
            </p>
          </div>
        </div>

        <div className="mb-6 relative">
          <Search className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        
        <div className="space-y-4">
          {completedExams.filter(exam => 
            exam.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
            exam.course_name.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 ? (
            <p className="text-zinc-500 text-sm">No completed exams found.</p>
          ) : (
            completedExams.filter(exam => 
              exam.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
              exam.course_name.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((exam, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                <div>
                  <p className="font-semibold">{exam.username}</p>
                  <p className="text-xs text-zinc-500">{exam.course_name}</p>
                  {exam.examCompletedAt && (
                    <p className="text-xs text-zinc-400 mt-1 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Completed: {new Date(exam.examCompletedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className="text-sm px-4 py-2 rounded-lg bg-emerald-100 text-emerald-600 font-bold flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  DONE
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
