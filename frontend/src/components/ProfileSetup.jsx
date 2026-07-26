import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE, useAuth } from "../context/AuthContext";

const ProfileSetup = ({ onCancel, onSuccess }) => {
 const { token, setUser } = useAuth(); // Extract authentication token
import { Upload, X, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast'; // Make sure this is installed
import { useNavigate } from 'react-router-dom';

const ProfileSetup = ({ onCancel, onSuccess }) => {
  const { token } = useAuth();

  const navigate = useNavigate(); // Add this inside your component

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
    if (token) fetchCurrentProfile();
  }, [token]);

  const fetchCurrentProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      setFormData({
        name: data.name || '',
        employeeId: data.employeeId || '',
        dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
        gender: data.gender || '',
        department: data.department || '',
        workLocation: data.workLocation || '',
        designationRole: data.designationRole || '',
      });
      if (data.profilePhoto) setPreviewUrl(data.profilePhoto);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load data.' });
    } finally {
      setFetching(false);
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => data.append(key, val));
      if (selectedFile) data.append('profilePhoto', selectedFile);

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
      await axios.put(`${API_BASE}/users/profile`, data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });

      // 1. Show the success toast
      toast.success('Profile Saved Successfully !!');

      // 2. Redirect to /profile after a short delay (so the user sees the toast)
      setTimeout(() => {
        navigate('/profile');
      }, 2000);

    } catch (err) {
      // Show error toast
      toast.error('Failed to update profile.');
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-10 flex items-center gap-3 text-slate-400"><Loader2 className="animate-spin" /> Loading...</div>;

  return (
    <div className="flex-1 p-6 md:p-8 max-w-4xl bg-slate-950">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-white mb-2">Edit Profile</h1>
        <p className="text-slate-400">Keep your professional and personal information current.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Profile Header (Avatar) */}
        <div className="flex items-center gap-8 pb-8 border-b border-slate-800">
          <div className="relative group">
            <div className="w-24 h-24 rounded-lg bg-slate-800 border-2 border-dashed border-slate-600 overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500"><Upload size={24} /></div>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-full cursor-pointer">
              <span className="text-xs font-bold text-white">Upload</span>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                setSelectedFile(e.target.files[0]);
                setPreviewUrl(URL.createObjectURL(e.target.files[0]));
              }} />
            </label>
          </div>
          <div>
            <h3 className="font-bold text-white">Profile Photo</h3>
            <p className="text-sm text-slate-400">Recommended: JPG or PNG, max 5MB.</p>
          </div>
        </div>

        {/* Professional Details Section */}
        <section className="grid md:grid-cols-2 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-6">Personal Identity</h3>
          </div>
          <Input label="Full Name" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="Employee ID" name="employeeId" value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} />
          <Input label="Date of Birth" type="date" name="dob" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} />
          <Select label="Gender" name="gender" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} options={['Male', 'Female', 'Other', 'Prefer not to say']} />
        </section>

        {/* Professional Details Section */}
        <section className="grid md:grid-cols-2 gap-8 border-t border-slate-800 pt-8">
          <div className="md:col-span-2">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-6">Professional Details</h3>
          </div>
          <Input label="Job Title" name="designationRole" value={formData.designationRole} onChange={(e) => setFormData({ ...formData, designationRole: e.target.value })} />
          <Input label="Department" name="department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
          <Input label="Work Location" name="workLocation" value={formData.workLocation} onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })} />
        </section>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-8 border-t border-slate-800">
          {message.text && (
            <span className={`text-sm font-medium ${message.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
              {message.text}
            </span>
          )}
          <div className="flex gap-4 ml-auto">
            <button type="button" onClick={onCancel} className="px-6 py-2.5 text-slate-400 hover:text-white font-medium transition">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition shadow-lg shadow-indigo-600/20">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// Helper components for clean code
const Input = ({ label, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-400">{label}</label>
    <input {...props} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none transition" />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-400">{label}</label>
    <select {...props} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none transition">
      <option value="">Select...</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);
}

export default ProfileSetup;