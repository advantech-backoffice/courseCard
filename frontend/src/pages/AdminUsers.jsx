import { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, Mail, Shield, X } from 'lucide-react';
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

  // 🔄 Load Users
  const fetchUsers = () => {
    fetch(`${API_BASE_URL}/users`)
      .then(res => res.json())
      .then(data => {
        data = data.filter((user)=>{return user.role != "admin"})
        setUsers(data);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 🔎 Filter Users
  const filteredUsers = users.filter(user =>
    (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 📝 Handle Form Change
  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ➕ ADD USER
  const handleAddUser = async () => {
    console.log(formData);
    
    if (!formData.username || !formData.email || !formData.password || !formData.role) {
      alert('Please fill out all fields, including role.');
      return;
    }

    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      fetchUsers();
      setShowAddModal(false);
      setFormData({ username: '', email: '', password: '', role: '' });
    } else {
      const errorData = await res.json().catch(() => ({}));
      alert(`Error creating user: ${errorData.message || 'Unknown error'}`);
    }
  };

  // ✏️ EDIT USER
  const handleEditUser = async () => {
    if (!formData.username || !formData.email || !formData.role) {
      alert('Please fill out name, email, and role.');
      return;
    }

    const res = await fetch(`${API_BASE_URL}/users/${editingUser._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      fetchUsers();
      setEditingUser(null);
    } else {
      const errorData = await res.json().catch(() => ({}));
      alert(`Error updating user: ${errorData.message || 'Unknown error'}`);
    }
  };

  // ❌ DELETE USER
  const handleDelete = async id => {
    if (!window.confirm('Delete this user?')) return;

    await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE'
    });

    fetchUsers();
  };

  // 🎯 Open Edit Modal
  const openEditModal = user => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role
    });
  };

  return (
    <div className="space-y-6">

      {/* 🔍 Search + Add Button */}
      <div className="flex justify-between">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="border p-3 rounded-xl w-72"
        />

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl"
        >
          <Plus className="mr-2" /> Add User
        </button>
      </div>

      {/* 📋 Users Table */}
      <table className="w-full dark:border-zinc-800 dark:bg-zinc-900 rounded-xl shadow">
        <thead>
          <tr className="border-b dark:border-zinc-800">
            <th className="p-4 text-left">User</th>
            <th className="p-4">Role</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            <tr><td className="p-6">Loading...</td></tr>
          ) : filteredUsers.length == 0 ?
             <tr className="border-b dark:border-zinc-800">

              <td className="p-4" colSpan={3}>
                No Records
              </td>
            </tr>
          :
          filteredUsers.map(user => (
            <tr key={user._id} className="border-b dark:border-zinc-800">

              <td className="p-4">
                <p className="font-semibold">{user.username}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </td>

              <td className="p-4 text-center">{user.role}</td>

              <td className="p-4 text-right space-x-2">
                <button
                  onClick={() => openEditModal(user)}
                  className="p-2 bg-blue-500 rounded"
                >
                  <Edit2 size={16} />
                </button>

                <button
                  onClick={() => handleDelete(user._id)}
                  className="p-2 bg-red-500 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </td>

            </tr>
          ))
        }
        </tbody>
      </table>

      {/* ================= ADD MODAL ================= */}

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

      {/* ================= EDIT MODAL ================= */}

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

/* ================= REUSABLE MODAL COMPONENT ================= */

function Modal({ title, onClose, onSubmit, formData, handleChange, showPassword }) {

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-indigo-950 p-8 rounded-2xl w-96 space-y-4">

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <input
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          className="w-full border p-3 rounded-lg"
        />

        <input
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border p-3 rounded-lg"
        />

        {showPassword && (
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
          />
        )}

        <div className="w-full border p-3 rounded-lg">
          <div className="text-sm font-medium mb-2">Select Role</div>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="role"
                value="student"
                checked={formData.role === 'student'}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="ml-2">Student</span>
            </label>

            <label className="inline-flex items-center">
              <input
                type="radio"
                name="role"
                value="teacher"
                checked={formData.role === 'teacher'}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="ml-2">Teacher</span>
            </label>

            <label className="inline-flex items-center">
              <input
                type="radio"
                name="role"
                value="admin"
                checked={formData.role === 'admin'}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="ml-2">Admin</span>
            </label>
          </div>
        </div>

        <button
          onClick={onSubmit}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl"
        >
          Save
        </button>

      </div>
    </div>
  );
}