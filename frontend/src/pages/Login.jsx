import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  KeyRound,
  Mail,
  Layers,
  ShieldCheck,
  User,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Headphones,
  Sparkles,
  CheckCircle2,
  Users,
  Activity,
  UserCheck
} from 'lucide-react';
import AnimatedTaskHub from '../components/AnimatedTaskHub';
import LeftForm from '../components/LeftForm';

const Auth = () => {
  const { user, login, register, error, setError } = useAuth();

  // View mode state: 'signin' or 'signup'
  const [isSignUp, setIsSignUp] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const toggleMode = (mode) => {
    setError(null);
    setIsSignUp(mode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (isSignUp) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setError(null);
    let demoEmail = '';
    let demoPassword = '';

    if (role === 'admin') {
      demoEmail = import.meta.env.VITE_DEFAULT_ADMIN_EMAIL || 'admin@company.com';
      demoPassword = import.meta.env.VITE_DEFAULT_ADMIN_PASSWORD || 'password123';
    } else {
      demoEmail = import.meta.env.VITE_DEFAULT_MEMBER_EMAIL || 'member1@company.com';
      demoPassword = import.meta.env.VITE_DEFAULT_MEMBER_PASSWORD || 'password123';
    }

    setEmail(demoEmail);
    setPassword(demoPassword);
    setSubmitting(true);

    try {
      await login(demoEmail, demoPassword);
      navigate('/');
    } catch (err) {
      console.error('Quick login error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex font-sans overflow-x-hidden">
      {/* items-stretch prevents height changes from pushing the right column */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 min-h-screen items-stretch">

        <LeftForm />

        {/* RIGHT SECTION: Feature Showcase & Interactive Task Board */}
        {/* sticky top-0 h-screen keeps this column completely fixed during transitions */}
        <div className="relative lg:col-span-6 bg-slate-950 p-6 sm:p-10 lg:p-14 flex flex-col justify-between overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-800/80 h-full lg:sticky lg:top-0 lg:h-screen">

          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          {/* Top Header Tag */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-2 shadow-sm backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span className="text-xs font-semibold text-indigo-300 tracking-wide">
                  Powered by <span className="text-white">NovaNectar</span>
                </span>
              </div>
            </div>

            <button className="flex items-center gap-2 text-xs text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 px-4 py-2 rounded-full transition-all backdrop-blur-md shadow-sm cursor-pointer">
              <Headphones className="w-3.5 h-3.5 text-indigo-400" />
              <span>Support</span>
            </button>
          </div>

          {/* Center Component */}
          <div className="relative z-10 my-auto py-6 max-w-xl mx-auto w-full">
            <div className="p-2 sm:p-7 relative space-y-4">
              <AnimatedTaskHub />
            </div>
          </div>

          {/* Bottom Descriptive Highlights */}
          <div className="relative z-10 space-y-4 max-w-xl mx-auto w-full">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
              <Layers className="w-3.5 h-3.5" />
              <span>TaskSphere Platform</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
              Smart collaboration for ambitious teams
            </h2>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Unify tasks, team discussions, and real-time project roadmaps into one intelligent workspace built for speed and precision.
            </p>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-[11px] font-medium text-slate-300">Auto Workflows</span>
              </div>
              <div className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span className="text-[11px] font-medium text-slate-300">Live Analytics</span>
              </div>
              <div className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span className="text-[11px] font-medium text-slate-300">Team Sync</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Auth;