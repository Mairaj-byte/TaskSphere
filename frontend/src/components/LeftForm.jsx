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

const LeftForm = () => {

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
    
      

  return (
    <>
    {/* LEFT SECTION: Sign In / Sign Up Form */}
        <div className="lg:col-span-6 p-6 sm:p-12 lg:p-16 flex flex-col justify-between bg-slate-900 border-r border-slate-800/80 h-full">
          <div className="w-full max-w-md mx-auto lg:mx-0">

            {/* Header Switcher */}
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {isSignUp ? 'Create an Account' : 'Sign in'}
              </h1>
              <p className="text-sm text-slate-400 mt-2">
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
            </div>

            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-3 p-3.5 mb-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                <p className="flex-1 leading-snug">{error}</p>
              </div>
            )}

            {/* Dynamic Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Full Name Input (Smooth Collapsible Grid) */}
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

              {/* Account Role Badge (Collapsible) */}
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
                    <a href="#forgot" className="text-slate-400 hover:text-indigo-400 transition-colors">
                      Forgot Password?
                    </a>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 px-4 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 cursor-pointer"
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

            {/* Quick Login Section (Collapsible Grid) */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                !isSignUp
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
            >
              <div className="overflow-hidden">
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900 px-3 text-slate-500 font-semibold tracking-wider">
                      OR QUICK LOGIN
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin')}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Continue as Manager</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('member')}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-50"
                  >
                    <User className="w-4 h-4 text-indigo-400" />
                    <span>Continue as Member</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
    </>
  )
}

export default LeftForm