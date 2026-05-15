import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import logo from '../public/finansia-logo.png';

const LoginPage = ({ onLogin }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error(t('auth.missing_fields') || 'Please enter both username and password');
      return;
    }

    setLoading(true);

    try {
      // Direct Grant Login attempt
      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('client_id', process.env.REACT_APP_KEYCLOAK_CLIENT_ID);
      params.append('username', username);
      params.append('password', password);
      params.append('scope', 'openid profile email');

      console.log('Attempting login for:', username);
      const tokenUrl = `${process.env.REACT_APP_KEYCLOAK_URL}/realms/${process.env.REACT_APP_KEYCLOAK_REALM}/protocol/openid-connect/token`;
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      const data = await response.json();
      console.log('Keycloak response:', response.status, data);

      if (response.ok) {
        toast.success(t('auth.welcome') || 'Welcome back!');
        onLogin(data);
      } else {
        toast.error(data.error_description || data.error || t('auth.login_failed'));
      }
    } catch (err) {
      console.error('Network or Fetch error:', err);
      toast.error("Network error: Make sure Keycloak is running on port 8080");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      {/* Animated background blobs */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>

      <div className="login-wrapper">
        {/* Card */}
        <div className="login-card">
          {/* Logo / Brand */}
          <div className="brand">
            <img src={logo} alt="Finansia Logo" className="brand-logo" />
          </div>

          <h1 className="login-title">{t('auth.welcome_back')}</h1>
          <p className="login-sub">{t('auth.login_subtitle')}</p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="field-group">
              <div className="field-wrap">
                <span className="field-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input
                  type="text"
                  className="field-input"
                  placeholder={t('auth.username_placeholder')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div className="field-group">
              <div className="field-wrap">
                <span className="field-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="field-input"
                  placeholder={t('auth.password_placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              <span>{loading ? t('auth.logging_in') : t('auth.login_btn')}</span>
              {!loading && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>

      <style jsx="true">{`
        :root {
          --orange-500: #f97316;
          --orange-600: #ea6a0a;
          --orange-400: #fb923c;
          --white: #ffffff;
          --gray-400: #9ca3af;
          --gray-600: #4b5563;
          --gray-800: #1f2937;
          --radius-xl: 1.25rem;
          --radius-lg: 0.75rem;
          --shadow-card: 0 20px 60px -10px rgba(249, 115, 22, 0.18), 0 4px 24px rgba(0,0,0,0.08);
        }

        .login-screen {
          min-height: 100vh;
          background: #fef3e8;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }

        .bg-blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.35;
          animation: drift 14s ease-in-out infinite alternate;
          pointer-events: none;
          z-index: 0;
        }
        .blob-1 { width: 520px; height: 520px; background: radial-gradient(circle, #fb923c 0%, #f97316 60%, transparent 100%); top: -160px; left: -160px; }
        .blob-2 { width: 400px; height: 400px; background: radial-gradient(circle, #fdba74 0%, #f97316 50%, transparent 100%); bottom: -120px; right: -120px; }
        .blob-3 { width: 280px; height: 280px; background: radial-gradient(circle, #fed7aa 0%, transparent 70%); top: 40%; left: 55%; }

        @keyframes drift {
          0% { transform: translate(0,0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.06); }
          100% { transform: translate(-20px, 30px) scale(0.96); }
        }

        .login-wrapper {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 440px;
          padding: 2rem;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(24px) saturate(1.4);
          -webkit-backdrop-filter: blur(24px) saturate(1.4);
          border: 1px solid rgba(255, 255, 255, 0.55);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-card);
          padding: 3rem 2.75rem 2.5rem;
          width: 100%;
          display: flex;
          flex-direction: column;
          animation: cardIn 0.5s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .brand { display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; }
        .brand-logo { width: 100%; max-width: 320px; mix-blend-mode: multiply; }

        .login-title {
          font-size: 1.85rem;
          font-weight: 700;
          color: var(--gray-800);
          letter-spacing: -0.5px;
          line-height: 1.2;
          text-align: center;
        }

        .login-sub {
          font-size: 0.875rem;
          color: var(--gray-400);
          margin-top: 0.4rem;
          margin-bottom: 2rem;
          text-align: center;
        }

        .login-form { display: flex; flex-direction: column; gap: 1.2rem; }
        .field-group { display: flex; flex-direction: column; gap: 0.45rem; }
        .field-wrap { position: relative; display: flex; align-items: center; }
        .field-icon { position: absolute; left: 0.9rem; color: var(--gray-400); display: flex; pointer-events: none; }
        .field-input {
          width: 100%;
          padding: 0.72rem 2.8rem 0.72rem 2.6rem;
          border: 1.5px solid #e5e7eb;
          border-radius: var(--radius-lg);
          background: rgba(255,255,255,0.6);
          font-size: 0.9rem;
          color: var(--gray-800);
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          outline: none;
        }
        .field-input:focus {
          border-color: var(--orange-400);
          background: rgba(255,255,255,0.9);
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
        }

        .toggle-pw {
          position: absolute;
          right: 0.9rem;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--gray-400);
          display: flex;
          padding: 0;
          transition: color 0.15s;
        }
        .toggle-pw:hover { color: var(--orange-500); }

        .form-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.82rem;
          color: var(--gray-600);
        }

        .remember-me { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none; }
        .remember-me input { display: none; }
        .checkmark {
          width: 16px; height: 16px;
          border: 1.5px solid #d1d5db;
          border-radius: 4px;
          background: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, border-color 0.15s;
        }
        .remember-me input:checked + .checkmark { background: var(--orange-500); border-color: var(--orange-500); }
        .remember-me input:checked + .checkmark::after {
          content: ''; display: block; width: 4px; height: 7px;
          border: 1.5px solid white; border-top: none; border-left: none;
          transform: rotate(45deg) translate(-1px, -1px);
        }

        .forgot-link { color: var(--orange-500); text-decoration: none; font-weight: 500; transition: color 0.15s; }
        .forgot-link:hover { color: var(--orange-600); text-decoration: underline; }

        .btn-submit {
          display: flex; align-items: center; justify-content: center; gap: 0.55rem;
          width: 100%; padding: 0.82rem 1.5rem;
          background: linear-gradient(135deg, var(--orange-500) 0%, var(--orange-600) 100%);
          color: white; font-size: 0.95rem; font-weight: 600;
          border: none; border-radius: var(--radius-lg);
          cursor: pointer; margin-top: 0.4rem;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 16px rgba(249,115,22,0.38);
        }
        .btn-submit:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(249,115,22,0.45); }

        .alert {
          position: fixed;
          top: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2000;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(12px);
          padding: 1rem 1.5rem;
          border-radius: var(--radius-lg);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          border-left: 4px solid #ef4444;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          cursor: pointer;
          font-weight: 600;
          color: #991b1b;
          animation: slideIn 0.5s cubic-bezier(.18,.89,.32,1.28);
        }
        @keyframes slideIn {
          from { transform: translate(-50%, -20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
