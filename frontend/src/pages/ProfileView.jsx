import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Standard Axios import
import { API_BASE, useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate

const ProfileView = ({ onEditClick }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { token } = useAuth(); // Get token from Auth Context
  const navigate = useNavigate(); // 2. Initialize hook

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(`${API_BASE}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setProfile(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (onEditClick) {
      onEditClick(); // Keeps backward compatibility if prop is passed
    } else {
      navigate('/profile/edit'); // 3. Navigate to ProfileSetup route
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-slate-600 font-medium">Loading profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 bg-red-50 rounded-xl text-center border border-red-200">
        <p className="text-red-600 font-medium mb-4">{error}</p>
        <button
          onClick={fetchProfile}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const initials = profile?.name ? profile.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="max-w-2xl mx-auto my-8 px-4">
  <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800/80 p-6 sm:p-8 backdrop-blur-sm">
    {/* Header Profile Section */}
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative">
        {profile?.profilePhoto ? (
          <img
            src={profile.profilePhoto}
            alt={profile.name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-indigo-500/20 shadow-lg shadow-indigo-500/10"
          />
        ) : (
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold ring-4 ring-indigo-500/20 shadow-lg shadow-indigo-500/10">
            {initials}
          </div>
        )}
      </div>

      <div className="text-center sm:text-left flex-1">
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">{profile?.name}</h2>
        <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2 items-center">
          <span className="inline-block px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold rounded-md uppercase tracking-wide">
            {profile?.designationRole || 'Member'}
          </span>
          {profile?.role && (
            <span className="inline-block px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700/60 text-xs font-semibold rounded-md uppercase tracking-wide">
              {profile?.role}
            </span>
          )}
        </div>
        <p className="text-slate-400 text-sm mt-2">{profile?.email}</p>
      </div>
    </div>

    <hr className="my-6 border-slate-800" />

    {/* Profile Info Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6">
      <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800/60">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Employee ID
        </span>
        <span className="text-sm font-semibold text-slate-200 mt-1 block">
          {profile?.employeeId || 'Not provided'}
        </span>
      </div>

      <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800/60">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Department
        </span>
        <span className="text-sm font-semibold text-slate-200 mt-1 block">
          {profile?.department || 'Not assigned'}
        </span>
      </div>

      <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800/60">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Work Location
        </span>
        <span className="text-sm font-semibold text-slate-200 mt-1 block">
          {profile?.workLocation || 'Not assigned'}
        </span>
      </div>

      <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800/60">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Gender
        </span>
        <span className="text-sm font-semibold text-slate-200 mt-1 block">
          {profile?.gender || 'Not specified'}
        </span>
      </div>

      <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800/60 sm:col-span-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Date of Birth
        </span>
        <span className="text-sm font-semibold text-slate-200 mt-1 block">
          {profile?.dob
            ? new Date(profile.dob).toLocaleDateString()
            : 'Not provided'}
        </span>
      </div>
    </div>

    {/* Footer Actions */}
    <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
      <button
        onClick={handleEdit}
        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition-colors duration-150 shadow-md shadow-indigo-600/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
      >
        Edit Profile
      </button>
    </div>
  </div>
</div>
  );
};

export default ProfileView;