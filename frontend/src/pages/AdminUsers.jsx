import { useEffect, useState, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, Upload, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { API_BASE_URL } from '../constants';

export default function AdminUsers() {

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredUsers = users.filter(user =>
    (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
      const res = await fetch(`${API_BASE_URL}/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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

  const openEditModal = user => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role
    });
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formDataObj = new FormData();
    formDataObj.append("file", file);

    try {
      const res = await fetch(`${API_BASE_URL}/users/bulk-upload`, {
        method: "POST",
        body: formDataObj,
      });

      const data = await res.json();

      if (res.ok) {
        let msg = data.message;
        if (data.errors && data.errors.length > 0) {
          msg += " Warnings: " + data.errors.join("; ");
        }
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
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Search + Add Button */}
      <div className="flex justify-between items-center gap-4">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 rounded-xl w-72 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
        />

        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition font-medium"
          >
            <Plus className="mr-2 w-4 h-4" /> Add User
          </button>

          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx,.xls"
            onChange={handleBulkUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
            className="flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-50 transition font-medium"
          >
            <Upload className="mr-2 w-4 h-4" /> {uploading ? "Uploading..." : "Bulk Upload Excel"}
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="p-4 text-left text-xs font-semibold text-zinc-500 uppercase">User</th>
              <th className="p-4 text-center text-xs font-semibold text-zinc-500 uppercase">Role</th>
              <th className="p-4 text-right text-xs font-semibold text-zinc-500 uppercase">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr><td className="p-6 text-zinc-500" colSpan={3}>Loading...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td className="p-6 text-zinc-500 text-center" colSpan={3}>No users found</td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user._id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                  <td className="p-4">
                    <p className="font-semibold">{user.username}</p>
                    <p className="text-sm text-zinc-500">{user.email}</p>
                  </td>

                  <td className="p-4 text-center">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 capitalize">
                      {user.role}
                    </span>
                  </td>

                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(user._id, user.username)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
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
        />
      )}

    </div>
  );
}

function Modal({ title, onClose, onSubmit, formData, handleChange, showPassword }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl w-96 space-y-4 border border-zinc-200 dark:border-zinc-800 shadow-2xl">

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition"><X className="w-5 h-5" /></button>
        </div>

        <input
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none transition"
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none transition"
        />

        {showPassword && (
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none transition"
          />
        )}

        {showPassword && (
          <div className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg">
            <div className="text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">Select Role</div>
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center cursor-pointer">
                <input type="radio" name="role" value="student" checked={formData.role === 'student'} onChange={handleChange} className="w-4 h-4" />
                <span className="ml-2 text-zinc-700 dark:text-zinc-300">Student</span>
              </label>
              <label className="inline-flex items-center cursor-pointer">
                <input type="radio" name="role" value="teacher" checked={formData.role === 'teacher'} onChange={handleChange} className="w-4 h-4" />
                <span className="ml-2 text-zinc-700 dark:text-zinc-300">Teacher</span>
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
