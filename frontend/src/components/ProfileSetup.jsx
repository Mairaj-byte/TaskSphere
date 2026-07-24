import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE, useAuth } from "../context/AuthContext";

const ProfileSetup = ({ onCancel, onSuccess }) => {
 const { token, setUser } = useAuth(); // Extract authentication token

  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    dob: '',
    gender: '',
    department: '',
    workLocation: '',
    designationRole: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (token) {
      fetchCurrentProfile();
    }
  }, [token]);

  const fetchCurrentProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = response.data;

      setFormData({
        name: data.name || '',
        employeeId: data.employeeId || '',
        dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
        gender: data.gender || '',
        department: data.department || '',
        workLocation: data.workLocation || '',
        designationRole: data.designationRole || '',
      });

      if (data.profilePhoto) {
        setPreviewUrl(data.profilePhoto);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to fetch existing profile details.',
      });
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('employeeId', formData.employeeId);
      data.append('dob', formData.dob);
      data.append('gender', formData.gender);
      data.append('department', formData.department);
      data.append('workLocation', formData.workLocation);
      data.append('designationRole', formData.designationRole);

      if (selectedFile) {
        data.append('profilePhoto', selectedFile);
      }

      const response = await axios.put(`${API_BASE}/users/profile`, data, {
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'multipart/form-data',
  },
});

// Get the latest logged-in user
const me = await axios.get(`${API_BASE}/auth/me`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Update the global AuthContext
setUser(me.data.user);

setMessage({
  type: 'success',
  text: 'Profile updated successfully!',
});

// Fetch the latest user details
const meResponse = await axios.get(`${API_BASE}/auth/me`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Update AuthContext
setUser(meResponse.data.user);

setMessage({
  type: 'success',
  text: 'Profile updated successfully!',
});

      if (onSuccess) {
        setTimeout(() => onSuccess(), 1000);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to update profile.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-slate-400 font-medium text-sm">Loading form...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-8 px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-slate-100">Edit Profile</h2>
        <p className="text-sm text-slate-400 mb-6">
          Update your personal details and work preferences.
        </p>

        {message.text && (
          <div
            className={`p-4 rounded-xl mb-6 text-sm font-medium border ${
              message.type === 'error'
                ? 'bg-red-950/40 text-red-400 border-red-900/50'
                : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Section */}
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs text-center font-medium p-1">
                  No Photo
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="profilePhoto"
                className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition"
              >
                Choose Photo
              </label>
              <input
                id="profilePhoto"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-xs text-slate-500 mt-1">
                JPG, PNG, or WEBP (Max 5MB)
              </p>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2 text-sm bg-slate-950 text-slate-100 placeholder-slate-600 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                name="employeeId"
                placeholder="e.g. EMP-101"
                value={formData.employeeId}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 text-slate-100 placeholder-slate-600 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Job Title / Designation
              </label>
              <input
                type="text"
                name="designationRole"
                placeholder="e.g. Software Engineer"
                value={formData.designationRole}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 text-slate-100 placeholder-slate-600 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Department
              </label>
              <input
                type="text"
                name="department"
                placeholder="e.g. Engineering"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 text-slate-100 placeholder-slate-600 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Work Location
              </label>
              <input
                type="text"
                name="workLocation"
                placeholder="e.g. Remote / Headquarters"
                value={formData.workLocation}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 text-slate-100 placeholder-slate-600 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 text-slate-100 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              >
                <option value="" className="bg-slate-900 text-slate-400">Select Gender</option>
                <option value="Male" className="bg-slate-900 text-slate-100">Male</option>
                <option value="Female" className="bg-slate-900 text-slate-100">Female</option>
                <option value="Other" className="bg-slate-900 text-slate-100">Other</option>
                <option value="Prefer not to say" className="bg-slate-900 text-slate-100">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-950 text-slate-100 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800/80">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700/80 font-medium text-sm rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition shadow-md shadow-indigo-950/50 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;