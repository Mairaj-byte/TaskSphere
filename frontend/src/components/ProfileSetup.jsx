import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { API_BASE, useAuth } from '../context/AuthContext';
import { 
  Upload, 
  Loader2, 
  User, 
  Briefcase, 
  Sparkles, 
  Camera, 
  X, 
  Save, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ProfileSetup = ({ onCancel, onSuccess }) => {
  const { token, setUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
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
        dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
        gender: data.gender || '',
        department: data.department || '',
        workLocation: data.workLocation || '',
        designationRole: data.designationRole || '',
      });
      if (data.profilePhoto) setPreviewUrl(data.profilePhoto);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load profile data.' });
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => data.append(key, val));
      if (selectedFile) data.append('profilePhoto', selectedFile);

      await axios.put(`${API_BASE}/users/profile`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const me = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(me.data.user);

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      toast.success('Profile saved successfully!');

      if (onSuccess) onSuccess();

      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      toast.error('Failed to update profile.');
      setMessage({ type: 'error', text: 'Failed to update profile details.' });
    } finally {
      setLoading(false);
    }
  };

  // Skeleton / Loader
  if (fetching) {
    return (
      <div className="flex-1 p-6 md:p-10 max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 backdrop-blur-md">
          <Loader2 className="animate-spin text-indigo-400" size={20} />
          <span className="text-sm font-medium">Fetching profile details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto space-y-8 text-slate-100">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800/80 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              Edit Profile
              <Sparkles size={20} className="text-indigo-400" />
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Keep your personal and professional details up to date.
            </p>
          </div>
          
          <button
            type="button"
            onClick={onCancel || (() => navigate('/profile'))}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-sm font-medium border border-slate-700/50 transition duration-200"
          >
            <X size={16} />
            <span>Cancel</span>
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Photo Upload Card */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Profile Photo
          </label>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group shrink-0">
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-slate-950 border-2 border-dashed border-slate-700/80 group-hover:border-indigo-500 transition duration-300 flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-slate-500">
                    <Upload size={22} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Upload</span>
                  </div>
                )}

                {/* Overlay trigger */}
                <label className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col items-center justify-center cursor-pointer text-white gap-1">
                  <Camera size={20} className="text-indigo-400" />
                  <span className="text-xs font-semibold">Change</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setSelectedFile(file);
                      setPreviewUrl(URL.createObjectURL(file));
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-sm font-semibold text-slate-200">Upload a new picture</h3>
              <p className="text-xs text-slate-400">
                Supports standard formats (JPG, PNG, WEBP). Recommended aspect ratio 1:1.
              </p>
            </div>
          </div>
        </div>

        {/* Personal Details Section */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <User size={18} />
            </div>
            <h2 className="text-base font-semibold text-white">Personal Identity</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <Input
              label="Full Name"
              name="name"
              placeholder="e.g. Alex Morgan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Date of Birth"
              type="date"
              name="dob"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            />
            <Select
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              options={['Male', 'Female', 'Other', 'Prefer not to say']}
            />
          </div>
        </div>

        {/* Professional Details Section */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Briefcase size={18} />
            </div>
            <h2 className="text-base font-semibold text-white">Professional Details</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <Input
              label="Job Title / Designation"
              name="designationRole"
              placeholder="e.g. Senior Software Engineer"
              value={formData.designationRole}
              onChange={(e) => setFormData({ ...formData, designationRole: e.target.value })}
            />
            <Input
              label="Department"
              name="department"
              placeholder="e.g. Product Development"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
            <Input
              label="Work Location"
              name="workLocation"
              placeholder="e.g. San Francisco, CA / Remote"
              value={formData.workLocation}
              onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
            />
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 md:p-6 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            {message.text && (
              <div className={`flex items-center gap-2 text-xs font-medium ${message.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                {message.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
                <span>{message.text}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onCancel || (() => navigate('/profile'))}
              className="flex-1 sm:flex-none px-5 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl font-medium text-sm transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl font-medium text-sm shadow-lg shadow-indigo-500/20 transition-all duration-200 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};

ProfileSetup.propTypes = {
  onCancel: PropTypes.func,
  onSuccess: PropTypes.func,
};

// Custom Inputs with Modern Glassmorphism Styling
const Input = ({ label, ...props }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-medium text-slate-400">{label}</label>
    <input
      {...props}
      className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition duration-200"
    />
  </div>
);

Input.propTypes = {
  label: PropTypes.string.isRequired,
};

const Select = ({ label, options, ...props }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-medium text-slate-400">{label}</label>
    <select
      {...props}
      className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition duration-200"
    >
      <option value="" className="bg-slate-900 text-slate-400">Select...</option>
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-slate-900 text-slate-200">
          {opt}
        </option>
      ))}
    </select>
  </div>
);

Select.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ProfileSetup;