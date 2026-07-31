import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import {
  KeyRound,
  Mail,
  Layers,
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
  UserCheck,
  ArrowLeft,
  Lock,
  Send
} from 'lucide-react';
import AnimatedTaskHub from '../components/AnimatedTaskHub';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const Auth = () => {
  const { user, login, register, error, setError, googleLogin } = useAuth();
  const navigate = useNavigate();

  // Navigation / View modes: 'auth' (signin/signup), 'forgot' (send OTP), 'reset' (verify OTP & new password)
  const [viewMode, setViewMode] = useState('auth');
  const [isSignUp, setIsSignUp] = useState(false);

  // Form input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Password reset states
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Feedback & submitting states
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Redirect if user is already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const resetMessages = () => {
    setError(null);
    setSuccessMessage('');
  };

  const toggleMode = (mode) => {
    resetMessages();
    setIsSignUp(mode);
  };

  const handleSwitchView = (mode) => {
    resetMessages();
    setViewMode(mode);
  };

  // Submit Handler for Login & Sign Up
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    resetMessages();

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

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setSubmitting(true);
      resetMessages();

      await googleLogin(credentialResponse.credential);
      navigate('/');
    } catch (err) {
      console.error('Google Auth Error:', err);
      setError(err.message || 'Google Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Send OTP Request Handler
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    resetMessages();

    try {
      const response = await fetch(`${API_BASE}/users/send-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to send OTP.');
      }

      setSuccessMessage('OTP sent to your email! Check your inbox.');
      setViewMode('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset Password Handler
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email || !otp || !newPassword) return;

    setSubmitting(true);
    resetMessages();

    try {
      const response = await fetch(`${API_BASE}/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to reset password.');
      }

      setSuccessMessage('Password reset successfully! You can now log in.');
      setOtp('');
      setNewPassword('');
      setPassword('');
      setViewMode('auth');
      setIsSignUp(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex font-sans overflow-x-hidden relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* GLOBAL BACKGROUND AMBIENT GLOW & GRID */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* MAIN CONTAINER */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 min-h-screen items-stretch z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

        {/* LEFT SECTION: Authentication Form (Full width on mobile) */}
        <div className="lg:col-span-6 p-6 sm:p-10 lg:p-16 flex flex-col justify-between bg-slate-950/40 backdrop-blur-md min-h-screen lg:min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="w-full max-w-md mx-auto mt-4 sm:mt-10 mb-auto">

            {/* Mobile Branding (Visible on mobile/tablet screens only) */}
            <div className="lg:hidden flex items-center gap-3 mb-10 ml-8 mt-13">
              <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                <Layers className="w-7 h-7 text-indigo-400" />
              </div>
              <span className="text-xl font-bold text-white tracking-wide">
                TaskSphere Platform
              </span>
            </div>

            {/* Dynamic Headers */}
            <div className="mb-6 sm:mb-8">
              {viewMode === 'auth' && (
                <>
                  <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {isSignUp ? 'Create an Account' : 'Sign in'}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2">
                    {isSignUp ? (
                      <span>
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => toggleMode(false)}
                          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                        >
                          Sign in
                        </button>
                      </span>
                    ) : (
                      <span>
                        Don't have an account?{' '}
                        <button
                          type="button"
                          onClick={() => toggleMode(true)}
                          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                        >
                          Create now
                        </button>
                      </span>
                    )}
                  </p>
                </>
              )}

              {viewMode === 'forgot' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleSwitchView('auth')}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors mb-4 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                  </button>
                  <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Reset Password
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2">
                    Enter your account email and we'll send you a 6-digit OTP code.
                  </p>
                </>
              )}

              {viewMode === 'reset' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleSwitchView('forgot')}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors mb-4 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Resend OTP
                  </button>
                  <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Verify OTP
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2">
                    Enter the OTP sent to <span className="text-indigo-300 font-medium">{email}</span> along with your new password.
                  </p>
                </>
              )}
            </div>

            {/* Global Feedback Banners */}
            {error && (
              <div className="flex items-center gap-3 p-3.5 mb-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                <p className="flex-1 leading-snug">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-3 p-3.5 mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm animate-in fade-in duration-200">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                <p className="flex-1 leading-snug">{successMessage}</p>
              </div>
            )}

            {/* VIEW 1: SIGN IN / SIGN UP */}
            {viewMode === 'auth' && (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name Input */}
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isSignUp
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <label htmlFor="name" className="block text-xs font-medium text-slate-400 mb-1.5">
                        Full Name
                      </label>
                      <div className="relative pb-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          id="name"
                          type="text"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required={isSignUp}
                          className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email Input */}
                  <div>
                    <label htmlFor="email" className="block text-xs font-medium text-slate-400 mb-1.5">
                      E-mail
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        placeholder="example@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label htmlFor="password" className="block text-xs font-medium text-slate-400 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-10 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Role Display */}
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isSignUp
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">
                        Account Role
                      </label>
                      <div className="w-full pl-3.5 pr-4 py-3 bg-slate-950/30 border border-slate-800/60 rounded-xl flex items-center justify-between text-slate-400 text-sm select-none">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-indigo-400" />
                          <span className="font-medium text-slate-200">Member</span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md uppercase font-semibold tracking-wider">
                          Default
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      !isSignUp
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="flex items-center justify-between text-xs py-1">
                        <label className="flex items-center text-slate-400 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 mr-2"
                          />
                          Remember me
                        </label>
                        <button
                          type="button"
                          onClick={() => handleSwitchView('forgot')}
                          className="text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-2 py-3 px-4 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 cursor-pointer text-sm sm:text-base"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isSignUp ? 'Creating account...' : 'Signing in...'}</span>
                      </>
                    ) : (
                      <span>{isSignUp ? 'Register as Member' : 'Sign in'}</span>
                    )}
                  </button>
                </form>

                {/* OR Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-slate-950 px-3 text-xs text-slate-400">
                      OR
                    </span>
                  </div>
                </div>

                {/* Google Login Component */}
<div className="w-full bg-slate-950/60 rounded-xl p-1 overflow-hidden">
  <GoogleLogin
    theme="filled_black"
    shape="rectangular"
    size="large"
    text={isSignUp ? "signup_with" : "signin_with"}
    width="100%"
    onSuccess={handleGoogleLogin}
    onError={() => {
      setError("Google Login Failed");
    }}
  />
</div>

                
              </>
            )}

            {/* VIEW 2: FORGOT PASSWORD (REQUEST OTP) */}
            {viewMode === 'forgot' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="block text-xs font-medium text-slate-400 mb-1.5">
                    E-mail Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="reset-email"
                      type="email"
                      placeholder="example@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !email}
                  className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 cursor-pointer text-sm sm:text-base"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Reset OTP</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* VIEW 3: RESET PASSWORD (VERIFY & SUBMIT) */}
            {viewMode === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* OTP Code */}
                <div>
                  <label htmlFor="otp" className="block text-xs font-medium text-slate-400 mb-1.5">
                    6-Digit OTP Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="otp"
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm tracking-widest font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label htmlFor="new-password" className="block text-xs font-medium text-slate-400 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-10 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !otp || !newPassword}
                  className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 cursor-pointer text-sm sm:text-base"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>

        {/* RIGHT SECTION: Feature Showcase (Hidden on Mobile, Visible on Desktop) */}
        <div className="hidden lg:flex lg:col-span-6 bg-slate-950/40 backdrop-blur-md p-10 lg:p-14 flex-col justify-between overflow-hidden border-l border-slate-800/80 sticky top-0 h-screen [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

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
            <div className="p-7 relative space-y-4">
              <AnimatedTaskHub />
            </div>
          </div>

          {/* Bottom Descriptive Highlights */}
          <div className="relative z-10 space-y-4 max-w-xl mx-auto w-full">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
              <Layers className="w-3.5 h-3.5" />
              <span>TaskSphere Platform</span>
            </div>

            <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">
              Smart collaboration for ambitious teams
            </h2>

            <p className="text-sm text-slate-400 leading-relaxed">
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