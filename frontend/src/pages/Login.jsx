import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, Layers, ShieldCheck, User } from 'lucide-react';

const Login = () => {
  const { user, login, error, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
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
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-box glass-card">
        <div className="login-brand">
          <Layers size={36} className="brand-glow-icon" />
          <h1>TaskSphere</h1>
          <p>Task Coordination & Workflow Management</p>
        </div>

        {error && (
          <div className="login-error-alert">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Work Email</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={18} />
              <input 
                id="email"
                type="email" 
                className="form-input" 
                placeholder="you@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <KeyRound className="input-icon" size={18} />
              <input 
                id="password"
                type="password" 
                className="form-input" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="quick-login-section">
          <p className="quick-title">Developer Quick Access</p>
          <div className="quick-buttons">
            <button onClick={() => handleQuickLogin('admin')} className="btn btn-secondary quick-btn">
              <ShieldCheck size={16} className="icon-admin" />
              <span>Manager Log In</span>
            </button>
            <button onClick={() => handleQuickLogin('member')} className="btn btn-secondary quick-btn">
              <User size={16} className="icon-member" />
              <span>Member Log In</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: #04060c;
          background-image: 
            radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.15) 0px, transparent 50%);
        }

        .login-box {
          width: 100%;
          max-width: 440px;
          padding: 2.5rem;
          border-radius: var(--border-radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(10, 16, 32, 0.85);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        }

        .login-brand {
          text-align: center;
          margin-bottom: 2rem;
        }

        .brand-glow-icon {
          color: var(--color-primary);
          filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.6));
          margin-bottom: 0.75rem;
        }

        .login-brand h1 {
          font-size: 1.8rem;
          font-weight: 800;
          background: linear-gradient(135deg, #fff, var(--color-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .login-brand p {
          color: var(--text-muted);
          font-size: 0.85rem;
          margin-top: 0.25rem;
        }

        .login-error-alert {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
          padding: 0.75rem;
          border-radius: var(--border-radius-sm);
          font-size: 0.85rem;
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .input-with-icon {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .input-with-icon .form-input {
          padding-left: 2.5rem;
          width: 100%;
        }

        .btn-block {
          width: 100%;
          margin-top: 1rem;
          padding: 0.8rem;
        }

        .quick-login-section {
          margin-top: 2rem;
          border-top: 1px solid var(--border-glass);
          padding-top: 1.5rem;
          text-align: center;
        }

        .quick-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }

        .quick-buttons {
          display: flex;
          gap: 0.75rem;
        }

        .quick-btn {
          flex: 1;
          font-size: 0.75rem;
          padding: 0.5rem;
          display: flex;
          gap: 0.4rem;
        }

        .icon-admin {
          color: var(--color-approved);
        }

        .icon-member {
          color: var(--color-primary);
        }
      `}</style>
    </div>
  );
};

export default Login;
