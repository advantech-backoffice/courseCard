import { useEffect, useState, useRef } from "react";
import {
  Bell,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Image,
  Video,
  Link2,
  ExternalLink
} from "lucide-react";
import { API_BASE_URL } from "../constants";
import { useAuth } from "../context/AuthContext";

export default function AdminNotices() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    caption: "",
    linkUrl: "",
    mediaType: "none",
    mediaUrl: "",
    mediaBase64: ""
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchNotices = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notices/admin`);
      const data = await res.json();
      setNotices(data);
    } catch {
      showToast("error", "Failed to load notices");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const openAddModal = () => {
    setEditingNotice(null);
    setFormData({ title: "", caption: "", linkUrl: "", mediaType: "none", mediaUrl: "", mediaBase64: "" });
    setShowModal(true);
  };

  const openEditModal = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title || "",
      caption: notice.caption || "",
      linkUrl: notice.linkUrl || "",
      mediaType: notice.mediaType || "none",
      mediaUrl: notice.mediaUrl || "",
      mediaBase64: notice.mediaBase64 || ""
    });
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "File must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) {
        showToast("error", "Only images and videos are allowed");
        return;
      }
      setFormData(prev => ({
        ...prev,
        mediaType: isImage ? "image" : "video",
        mediaBase64: reader.result,
        mediaUrl: ""
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      showToast("error", "Title is required");
      return;
    }

    const payload = {
      ...formData,
      createdBy: user?._id
    };

    try {
      const url = editingNotice
        ? `${API_BASE_URL}/notices/${editingNotice._id}`
        : `${API_BASE_URL}/notices`;
      const method = editingNotice ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast("success", editingNotice ? "Notice updated" : "Notice created");
        setShowModal(false);
        fetchNotices();
      } else {
        const data = await res.json();
        showToast("error", data.message || "Failed");
      }
    } catch {
      showToast("error", "Failed to save notice");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this notice?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notices/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "Notice deleted");
        fetchNotices();
      } else {
        showToast("error", "Failed to delete");
      }
    } catch {
      showToast("error", "Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-8 z-50">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl border flex items-center space-x-3 ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingNotice ? "Edit Notice" : "New Notice"}</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Notice title"
                  className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-blue-600 outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">Caption</label>
                <textarea
                  value={formData.caption}
                  onChange={e => setFormData({ ...formData, caption: e.target.value })}
                  placeholder="Brief description or message..."
                  rows={3}
                  className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-blue-600 outline-none transition resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">Link (optional)</label>
                <input
                  type="url"
                  value={formData.linkUrl}
                  onChange={e => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-blue-600 outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Media</label>
                <div className="flex gap-2 mb-3">
                  {[
                    { value: "none", label: "None", icon: X },
                    { value: "image", label: "Image", icon: Image },
                    { value: "video", label: "Video", icon: Video }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setFormData(prev => ({ ...prev, mediaType: opt.value, mediaUrl: "", mediaBase64: "" }))}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
                        formData.mediaType === opt.value
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>

                {formData.mediaType !== "none" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Paste URL</label>
                      <input
                        type="url"
                        value={formData.mediaUrl}
                        onChange={e => setFormData({ ...formData, mediaUrl: e.target.value, mediaBase64: "" })}
                        placeholder={formData.mediaType === "image" ? "https://example.com/image.jpg" : "https://youtube.com/watch?v=..."}
                        className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-blue-600 outline-none transition text-sm"
                      />
                    </div>
                    <div className="text-center text-xs text-zinc-400">or</div>
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept={formData.mediaType === "image" ? "image/*" : "video/*"}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-4 py-2.5 rounded-xl border border-dashed border-zinc-300 text-zinc-600 hover:bg-zinc-50 transition text-sm font-medium"
                      >
                        Upload {formData.mediaType === "image" ? "Image" : "Video"} (max 5MB)
                      </button>
                    </div>
                    {(formData.mediaBase64 || formData.mediaUrl) && (
                      <div className="rounded-xl overflow-hidden border border-zinc-200">
                        {formData.mediaType === "image" ? (
                          <img
                            src={formData.mediaBase64 || formData.mediaUrl}
                            alt="Preview"
                            className="w-full h-40 object-cover"
                          />
                        ) : (
                          <video
                            src={formData.mediaBase64 || formData.mediaUrl}
                            className="w-full h-40 object-cover"
                            controls
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition font-medium">
                Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition font-medium">
                {editingNotice ? "Save Changes" : "Create Notice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Notices</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage announcements for students</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition font-medium"
        >
          <Plus className="w-4 h-4" />
          New Notice
        </button>
      </div>

      {/* Notices Table */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Notice</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Media</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Link</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 w-48 bg-zinc-100 rounded-lg" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-zinc-100 rounded-full" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-zinc-100 rounded-full" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-24 bg-zinc-100 rounded-full" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-zinc-100 rounded-full" /></td>
                  </tr>
                ))
              ) : notices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-zinc-400">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                    <p className="font-medium">No notices yet</p>
                    <p className="text-sm mt-1">Create your first notice to get started</p>
                  </td>
                </tr>
              ) : (
                notices.map(notice => (
                  <tr key={notice._id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                          <Bell className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 truncate max-w-xs">{notice.title}</p>
                          {notice.caption && <p className="text-xs text-zinc-500 truncate max-w-xs">{notice.caption}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {notice.mediaType !== "none" ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          notice.mediaType === "image" ? "bg-blue-100 text-blue-600" : "bg-violet-100 text-violet-600"
                        }`}>
                          {notice.mediaType === "image" ? "Image" : "Video"}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {notice.linkUrl ? (
                        <a href={notice.linkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline text-sm">
                          <ExternalLink className="w-3.5 h-3.5" />
                          Link
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-500">
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEditModal(notice)}
                          className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(notice._id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
