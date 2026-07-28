import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Briefcase,
  MapPin,
  Calendar,
  Building2,
  BadgeCheck,
  Pencil,
} from "lucide-react";

import { API_BASE, useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";


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
      <div className="min-h-[70vh] flex justify-center items-center bg-slate-950">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              repeat: Infinity,
              duration: 1,
              ease: "linear",
            }}
            className="h-16 w-16 rounded-full border-4 border-indigo-500 border-t-transparent"
          />

          <motion.p
            initial={{ y: 10 }}
            animate={{ y: 0 }}
            className="mt-6 text-slate-300 font-medium tracking-wide"
          >
            Loading Your Profile...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-[60vh] flex items-center justify-center px-5"
      >
        <div className="max-w-md w-full rounded-3xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl p-8 text-center shadow-2xl">

          <h2 className="text-2xl font-bold text-red-400 mb-3">
            Something went wrong
          </h2>

          <p className="text-slate-300 mb-8">
            {error}
          </p>

          <button
            onClick={fetchProfile}
            className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 transition-all duration-300 text-white font-semibold"
          >
            Retry
          </button>

        </div>
      </motion.div>
    );
  }

  const initials = profile?.name ? profile.name.charAt(0).toUpperCase() : 'U';

  return (

    <div className="relative overflow-hidden py-12 px-4">

      {/* Background Blur Effects */}

      <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-[140px]" />

      <div className="absolute bottom-0 right-0 h-[350px] w-[350px] rounded-full bg-purple-500/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .6 }}
        className="relative max-w-3xl mx-auto"
      >

        <div className="rounded-[32px] border border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,.45)] overflow-hidden">

          {/* Header */}

          <div className="relative p-8 sm:p-10">

            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-transparent to-purple-600/10" />

            <div className="relative flex flex-col sm:flex-row items-center gap-8">

              <motion.div

                whileHover={{
                  scale: 1.08,
                  rotate: 3
                }}

                transition={{
                  type: "spring",
                  stiffness: 250
                }}

                className="relative"
              >

                {profile?.profilePhoto ? (

                  <img
                    src={profile.profilePhoto}
                    alt={profile.name}
                    className="w-32 h-32 rounded-full object-cover border-[5px] border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,.45)]"
                  />

                ) : (

                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-blue-500 flex items-center justify-center text-5xl text-white font-bold shadow-[0_0_45px_rgba(99,102,241,.45)]">

                    {initials}

                  </div>

                )}

                <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-green-400 border-4 border-slate-900" />

              </motion.div>

              <div className="flex-1 text-center sm:text-left">

                <motion.h1

                  initial={{ opacity: 0, x: -20 }}

                  animate={{ opacity: 1, x: 0 }}

                  transition={{ delay: .2 }}

                  className="text-4xl font-extrabold bg-gradient-to-r from-white via-indigo-300 to-purple-300 bg-clip-text text-transparent"
                >

                  {profile?.name}

                </motion.h1>

                <div className="mt-4 flex flex-wrap gap-3 justify-center sm:justify-start">

                  <span className="px-4 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-widest">

                    {profile?.designationRole || "Member"}

                  </span>

                  {profile?.role && (

                    <span className="px-4 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold uppercase tracking-widest">

                      {profile.role}

                    </span>

                  )}

                </div>

                <div className="mt-5 flex justify-center sm:justify-start items-center gap-2 text-slate-400">

                  <Mail size={17} />

                  <p className="text-sm">

                    {profile?.email}

                  </p>

                </div>

              </div>

            </div>

          </div>

          <hr className="my-6 border-slate-800" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-8">

            {[
              {
                icon: <BadgeCheck size={18} />,
                title: "Employee ID",
                value: profile?.employeeId || "Not provided",
              },
              {
                icon: <Building2 size={18} />,
                title: "Department",
                value: profile?.department || "Not assigned",
              },
              {
                icon: <MapPin size={18} />,
                title: "Work Location",
                value: profile?.workLocation || "Not assigned",
              },
              {
                icon: <User size={18} />,
                title: "Gender",
                value: profile?.gender || "Not specified",
              },
              {
                icon: <Calendar size={18} />,
                title: "Date of Birth",
                value: profile?.dob
                  ? new Date(profile.dob).toLocaleDateString()
                  : "Not provided",
                full: true,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{
                  y: -6,
                  scale: 1.02,
                }}
                className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 transition-all duration-300 hover:border-indigo-500/40 hover:shadow-[0_10px_35px_rgba(99,102,241,.25)]
      ${item.full ? "md:col-span-2" : ""}`}
              >
                <div className="flex items-center gap-3 mb-3 text-indigo-300">
                  {item.icon}
                  <h3 className="uppercase tracking-wider text-xs font-semibold">
                    {item.title}
                  </h3>
                </div>

                <p className="text-slate-100 text-base font-semibold break-words">
                  {item.value}
                </p>
              </motion.div>
            ))}

          </div>

          <div className="border-t border-white/10 px-8 py-6 flex justify-end">

            <motion.button
              whileHover={{
                scale: 1.05,
                y: -2,
              }}
              whileTap={{
                scale: 0.95,
              }}
              onClick={handleEdit}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-white font-semibold shadow-lg shadow-indigo-500/30 transition-all"
            >
              <Pencil size={18} />
              Edit Profile
            </motion.button>

          </div>

        </div> {/* Card */}

      </motion.div>

    </div>
  );
};

export default ProfileView;
