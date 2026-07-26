import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE, useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Briefcase, MapPin, Calendar, User as UserIcon, Shield } from 'lucide-react';

const ProfileView = ({ onEditClick }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  

  if (loading) return <div className="p-8 text-slate-400">Loading profile data...</div>;

  return (
    <div className="flex-1 p-6 md:p-8 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Profile Overview</h1>
          <p className="text-slate-400">Manage your personal and professional information.</p>
        </div>
        <button
          onClick={() => onEditClick ? onEditClick() : navigate('/profile/edit')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Edit Profile
        </button>
      </div>

      {/* Main Profile Header */}
      <div className="flex items-center gap-6 mb-12">

        <div className="relative p-[2px] bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl">
  {profile?.profilePhoto ? (
    <img 
      src={profile.profilePhoto} 
      alt={profile.name} 
      className="w-24 h-24 rounded-lg object-cover" 
    />
  ) : (
    <div className="w-24 h-24 rounded-lg bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white">
      {profile?.name?.charAt(0).toUpperCase()}
    </div>
  )}
</div>


        <div>
          <h2 className="text-3xl font-bold text-white mb-1">{profile?.name}</h2>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1.5"><Mail size={16} /> {profile?.email}</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5"><Shield size={16} /> {profile?.role || 'User'}</span>
          </div>
        </div>
      </div>

      {/* Details Sections */}
      <div className="grid md:grid-cols-2 gap-12">
        
        {/* Personal Details */}
        <section>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Personal Details</h3>
          <div className="space-y-6">
            <DetailRow icon={<UserIcon size={18} />} label="Full Name" value={profile?.name} />
            <DetailRow icon={<Calendar size={18} />} label="Date of Birth" value={profile?.dob ? new Date(profile.dob).toLocaleDateString() : 'Not set'} />
            <DetailRow icon={<UserIcon size={18} />} label="Gender" value={profile?.gender || 'Not set'} />
          </div>
        </section>

        {/* Work Details */}
        <section>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Professional Details</h3>
          <div className="space-y-6">
            <DetailRow icon={<Briefcase size={18} />} label="Role / Designation" value={profile?.designationRole || 'Not assigned'} />
            <DetailRow icon={<MapPin size={18} />} label="Department" value={profile?.department || 'Not assigned'} />
            <DetailRow icon={<MapPin size={18} />} label="Work Location" value={profile?.workLocation || 'Not assigned'} />
          </div>
        </section>

      </div>
    </div>
  );
};

// Simple reusable sub-component for rows
const DetailRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-4">
    <div className="text-slate-500 mt-0.5">{icon}</div>
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-slate-200 font-medium">{value}</p>
    </div>
  </div>
);

export default ProfileView;