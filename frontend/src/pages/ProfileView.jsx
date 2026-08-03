import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE, useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mail, Briefcase, MapPin, Calendar, User as UserIcon, ShieldCheck, Edit3, Sparkles, Building2,
  Link2, Unlink, Loader2, CheckCircle2, AlertCircle, Hash
} from 'lucide-react';

const ProfileView = ({ onEditClick }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Google Calendar sync (spec section 15)
  const [calendarStatus, setCalendarStatus] = useState({ featureEnabled: false, connected: false });
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarActionLoading, setCalendarActionLoading] = useState(false);
  const [calendarToast, setCalendarToast] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [token]);

  useEffect(() => {
    fetchCalendarStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Handle the redirect back from Google's OAuth consent screen
  // (backend sends the browser to /profile?calendar=connected|error)
  useEffect(() => {
    const calendarResult = searchParams.get('calendar');
    if (calendarResult === 'connected') {
      setCalendarToast('Google Calendar connected successfully!');
      fetchCalendarStatus();
      setSearchParams({}, { replace: true });
    } else if (calendarResult === 'error') {
      setCalendarToast('Failed to connect Google Calendar. Please try again.');
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!calendarToast) return;
    const t = setTimeout(() => setCalendarToast(null), 4000);
    return () => clearTimeout(t);
  }, [calendarToast]);

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

  const fetchCalendarStatus = async () => {
    if (!token) return;
    setCalendarLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/calendar/google/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCalendarStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch calendar status', err);
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleConnectCalendar = async () => {
    setCalendarActionLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/calendar/google/auth-url`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.href = res.data.url;
    } catch (err) {
      setCalendarToast(err.response?.data?.error || 'Could not start Google Calendar connection.');
      setCalendarActionLoading(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    setCalendarActionLoading(true);
    try {
      await axios.post(
        `${API_BASE}/calendar/google/disconnect`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCalendarToast('Google Calendar disconnected.');
      fetchCalendarStatus();
    } catch (err) {
      setCalendarToast('Failed to disconnect Google Calendar.');
    } finally {
      setCalendarActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-400">Loading profile data...</div>;

  if (error) {
    return (
      <div className="flex-1 p-6 md:p-10 max-w-xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl flex items-center gap-4">
          <AlertCircle size={24} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto space-y-8 text-slate-100">
      {calendarToast && (
        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-900 text-white shadow-lg text-sm">
          <CheckCircle2 size={16} className="text-emerald-400" />
          {calendarToast}
        </div>
      )}

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800/80 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        {/* Subtle Background Glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

          {/* User Info & Avatar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300" />
              <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                {profile?.profilePhoto ? (
                  <img
                    src={profile.profilePhoto}
                    alt={profile?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-extrabold bg-gradient-to-br from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    {profile?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                  {profile?.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <ShieldCheck size={14} />
                  {profile?.role || 'Member'}
                </span>
              </div>

              <p className="text-sm text-slate-400 flex items-center gap-2">
                <Mail size={15} className="text-slate-500" />
                {profile?.email}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => onEditClick ? onEditClick() : navigate('/profile/edit')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 active:scale-[0.98]"
          >
            <Edit3 size={16} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Grid Content Sections */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Personal Info Card */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md hover:border-slate-700/80 transition-colors">
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <UserIcon size={18} />
            </div>
            <h2 className="text-base font-semibold text-white tracking-wide">
              Personal Information
            </h2>
          </div>

          <div className="space-y-4">
            <DetailItem
              icon={<UserIcon size={18} />}
              label="Full Name"
              value={profile?.name}
            />
            <DetailItem
              icon={<Calendar size={18} />}
              label="Date of Birth"
              value={profile?.dob ? new Date(profile.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : null}
            />
            <DetailItem
              icon={<Sparkles size={18} />}
              label="Gender"
              value={profile?.gender}
            />
          </div>
        </div>

        {/* Professional Info Card */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md hover:border-slate-700/80 transition-colors">
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Briefcase size={18} />
            </div>
            <h2 className="text-base font-semibold text-white tracking-wide">
              Professional Details
            </h2>
          </div>

          <div className="space-y-4">
            <DetailItem
              icon={<Hash size={18} />}
              label="Indentity "
              value={profile?.employeeId}
            />
            <DetailItem
              icon={<Briefcase size={18} />}
              label="Role / Designation"
              value={profile?.designationRole}
            />
            <DetailItem
              icon={<Building2 size={18} />}
              label="Department"
              value={profile?.department}
            />
            <DetailItem
              icon={<MapPin size={18} />}
              label="Work Location"
              value={profile?.workLocation}
            />
          </div>
        </div>

      </div>

      {/* Calendar Sync (spec section 15) */}
      {!calendarLoading && calendarStatus.featureEnabled && (
        <div className="mt-12 pt-8 border-t border-slate-800">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Integrations</h3>
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-indigo-400" />
              <div>
                <p className="text-sm font-semibold text-white">Google Calendar</p>
                <p className="text-xs text-slate-400">
                  {calendarStatus.connected
                    ? 'Your tasks are synced to your Google Calendar.'
                    : 'Connect your Google account to see task deadlines on your calendar.'}
                </p>
              </div>
            </div>

            {calendarStatus.connected ? (
              <button
                onClick={handleDisconnectCalendar}
                disabled={calendarActionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-400 border border-rose-800 hover:bg-rose-950/40 disabled:opacity-50 rounded-lg transition-colors"
              >
                {calendarActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Unlink size={14} />}
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleConnectCalendar}
                disabled={calendarActionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {calendarActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                Connect
              </button>
            )}
          </div>
        </div>
      )}

      {!calendarLoading && !calendarStatus.featureEnabled && (
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-slate-500 text-xs">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>Google Calendar sync hasn't been enabled by your administrator yet.</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Refined Detail Row Sub-component
const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 border border-slate-800/40 transition-colors">
    <div className="flex items-center gap-3">
      <div className="text-slate-400">
        {icon}
      </div>
      <span className="text-xs font-medium text-slate-400">{label}</span>
    </div>
    <span className={`text-sm font-medium ${value ? 'text-slate-100' : 'text-slate-500 italic'}`}>
      {value || 'Not provided'}
    </span>
  </div>
);

export default ProfileView;