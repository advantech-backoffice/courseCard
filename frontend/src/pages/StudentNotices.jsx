import { useEffect, useState } from "react";
import { Bell, ExternalLink, Image, Video, ArrowLeft } from "lucide-react";
import { API_BASE_URL } from "../constants";
import { Link } from "react-router-dom";

export default function StudentNotices() {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/notices/student`)
      .then(res => res.json())
      .then(data => {
        setNotices(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const openNotice = async (notice) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notices/student/${notice._id}`);
      const full = await res.json();
      setSelectedNotice(full);
    } catch {
      setSelectedNotice(notice);
    }
  };

  if (selectedNotice) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => setSelectedNotice(null)}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-700 transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all notices
        </button>

        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          {selectedNotice.mediaType !== "none" && (
            <div className="w-full">
              {selectedNotice.mediaType === "image" ? (
                <img
                  src={selectedNotice.mediaBase64 || selectedNotice.mediaUrl}
                  alt={selectedNotice.title}
                  className="w-full max-h-96 object-cover"
                />
              ) : (
                <video
                  src={selectedNotice.mediaBase64 || selectedNotice.mediaUrl}
                  className="w-full max-h-96 object-cover"
                  controls
                />
              )}
            </div>
          )}

          <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold text-zinc-900">{selectedNotice.title}</h1>

            {selectedNotice.caption && (
              <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">{selectedNotice.caption}</p>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
              <span className="text-sm text-zinc-400">
                {new Date(selectedNotice.createdAt).toLocaleDateString("en-US", {
                  year: "numeric", month: "long", day: "numeric"
                })}
              </span>
              {selectedNotice.linkUrl && (
                <a
                  href={selectedNotice.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition font-medium text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit Link
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notices</h1>
          <p className="text-sm text-zinc-500 mt-1">Latest announcements from admin</p>
        </div>
        <Link
          to="/student/dashboard"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden animate-pulse">
              <div className="h-48 bg-zinc-100" />
              <div className="p-4 space-y-2">
                <div className="h-5 w-3/4 bg-zinc-100 rounded" />
                <div className="h-4 w-full bg-zinc-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-16 text-center">
          <Bell className="w-16 h-16 mx-auto mb-4 text-zinc-300" />
          <p className="text-lg font-semibold text-zinc-500">No notices yet</p>
          <p className="text-sm text-zinc-400 mt-1">Check back later for announcements</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notices.map(notice => (
            <button
              key={notice._id}
              onClick={() => openNotice(notice)}
              className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden text-left hover:shadow-md hover:border-zinc-300 transition-all"
            >
         {notice.mediaType !== "none" && (notice.mediaUrl || notice.mediaBase64) && (
          <div className="relative">
           {notice.mediaType === "image" ? (
            <img
             src={notice.mediaBase64 || notice.mediaUrl}
             alt={notice.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-zinc-100 flex items-center justify-center">
                      <Video className="w-12 h-12 text-zinc-400" />
                    </div>
                  )}
                  <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium ${
                    notice.mediaType === "image" ? "bg-blue-600 text-white" : "bg-violet-600 text-white"
                  }`}>
                    {notice.mediaType === "image" ? "Image" : "Video"}
                  </span>
                </div>
              )}

              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-zinc-900 line-clamp-1">{notice.title}</h3>
                  {notice.linkUrl && (
                    <ExternalLink className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  )}
                </div>
                {notice.caption && (
                  <p className="text-sm text-zinc-500 line-clamp-2">{notice.caption}</p>
                )}
                <p className="text-xs text-zinc-400">
                  {new Date(notice.createdAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric"
                  })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
