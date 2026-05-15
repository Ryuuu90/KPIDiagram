import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import keycloak from "./keycloak";
import { KeycloakProvider } from "./contexts/KeycloakContext";
import { DiagramProvider } from "./contexts/DiagramContext";

import Layout from "./components/Layout";
import KPIDiagram from "./components/KPIDiagram";
import LoanCalculator from "./components/loanCalculator";
import LoadingPage from "./components/loadingPage";
import InvestissementPage from "./pages/investissementPage";
import DataManagementPage from "./pages/DataManagementPage";
import LoginPage from "./pages/LoginPage";
import toast, { Toaster } from "react-hot-toast";

// Possible app states
const STATE = {
  LOADING: "loading",        // Keycloak initialising OR waiting for backend
  AUTHENTICATED: "ok",       // Keycloak ✅  +  backend ✅
  UNAUTHENTICATED: "unauth", // Not logged in — show custom login page
  FORBIDDEN: "forbidden",    // Keycloak ✅  but backend ❌ (deactivated / 403)
  ERROR: "error",            // Unexpected error
};

function App() {
  const { t } = useTranslation();
  const [appState, setAppState] = useState(STATE.LOADING);
  const [forbiddenMessage, setForbiddenMessage] = useState("");
  const refreshIntervalRef = useRef(null);

  const verifyUser = async (token) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        // All good — start the silent token refresh interval
        // Clear any existing interval first
        if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);

        refreshIntervalRef.current = setInterval(() => {
          keycloak.updateToken(70).catch(() => {
            console.warn("Token refresh failed — logging out.");
            toast.error(t('auth.session_expired') || "Session expired");
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
            keycloak.logout();
          });
        }, 60_000);

        setAppState(STATE.AUTHENTICATED);
      } else if (response.status === 403) {
        const body = await response.json();
        const msg = body.message || t('auth.contact_admin');
        setForbiddenMessage(msg);
        toast.error(msg);
        setAppState(STATE.FORBIDDEN);
      } else {
        // 401 or other error — Show error screen instead of infinite reload
        const msg = t('auth.login_failed');
        setForbiddenMessage(msg);
        toast.error(msg);
        setAppState(STATE.ERROR);
      }
    } catch (err) {
      console.error("Backend verification failed:", err);
      toast.error(t('auth.unexpected_error'));
      setAppState(STATE.ERROR);
    }
  };

  const handleManualLogin = async (tokens) => {
    setAppState(STATE.LOADING);
    try {
      // Instead of re-initializing, we manually set the tokens on the existing instance
      keycloak.token = tokens.access_token;
      keycloak.refreshToken = tokens.refresh_token;
      keycloak.idToken = tokens.id_token;
      keycloak.authenticated = true;

      // Manually trigger parsing and profile loading
      if (tokens.id_token) {
        // This ensures tokenParsed is available immediately
        keycloak.idTokenParsed = JSON.parse(atob(tokens.id_token.split('.')[1]));
      }
      if (tokens.access_token) {
        keycloak.tokenParsed = JSON.parse(atob(tokens.access_token.split('.')[1]));
      }

      await verifyUser(tokens.access_token);
    } catch (err) {
      console.error("Manual login token injection failed:", err);
      setAppState(STATE.ERROR);
    }
  };

  useEffect(() => {
    keycloak
      .init({ onLoad: "check-sso", checkLoginIframe: false })
      .then(async (auth) => {
        if (!auth) {
          // Not logged in — show our custom React login page
          setAppState(STATE.UNAUTHENTICATED);
          return;
        }

        // ── Backend verification ──────────────────────────────────────────────
        await verifyUser(keycloak.token);
      })
      .catch((err) => {
        console.error("Keycloak init error", err);
        setAppState(STATE.ERROR);
      });

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, []);

  // ── Loading screen ────────────────────────────────────────────────────────
  if (appState === STATE.LOADING) {
    return <LoadingPage />;
  }

  // ── Unauthenticated / Login Page ──────────────────────────────────────────
  if (appState === STATE.UNAUTHENTICATED) {
    return <LoginPage onLogin={handleManualLogin} />;
  }

  // ── Deactivated account screen ────────────────────────────────────────────
  if (appState === STATE.FORBIDDEN) {
    return <AccessDenied message={forbiddenMessage} />;
  }

  // ── Unexpected error screen ───────────────────────────────────────────────
  if (appState === STATE.ERROR) {
    return <AccessDenied message={t('auth.unexpected_error')} />;
  }

  // ── Dashboard (fully verified) ────────────────────────────────────────────
  return (
    <KeycloakProvider keycloak={keycloak}>
      <DiagramProvider>
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              padding: '12px 24px',
              fontWeight: '600',
              fontSize: '0.9rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            success: {
              style: {
                background: '#ecfdf5',
                color: '#059669',
                border: '1px solid #10b981',
              },
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              style: {
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #ef4444',
              },
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Router>
          <Layout>
            <Routes>
              <Route
                path="/"
                element={<KPIDiagram initialMode="élément comptable" />}
              />
              <Route
                path="/ratio"
                element={<KPIDiagram initialMode="ratio" />}
              />
              <Route
                path="/simulation"
                element={<KPIDiagram initialMode="simulation" />}
              />
              <Route
                path="/reports"
                element={<KPIDiagram initialMode="reports" />}
              />
              <Route path="/loan-calculator" element={<LoanCalculator />} />
              <Route path="/investissement" element={<InvestissementPage />} />
              <Route path="/data-management" element={<DataManagementPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      </DiagramProvider>
    </KeycloakProvider>
  );
}

// ── Reusable access-denied screen ────────────────────────────────────────────
function AccessDenied({ message }) {
  const { t } = useTranslation();
  return (
    <div style={styles.root}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.card}>
        <div style={styles.iconWrap}>
          {/* Shield / lock icon */}
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
            stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 style={styles.title}>{t('auth.access_denied')}</h1>
        <p style={styles.message}>{message}</p>
        <button
          style={styles.btn}
          onClick={() => keycloak.logout({ redirectUri: window.location.origin })}
        >
          {t('auth.back_to_login')}
        </button>
      </div>
    </div>
  );
}

const styles = {
  root: {
    position: "relative",
    minHeight: "100vh",
    background: "#fef3e8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    overflow: "hidden",
  },
  blob1: {
    position: "absolute",
    width: 500, height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, #fb923c, #f97316 60%, transparent)",
    filter: "blur(80px)",
    opacity: 0.28,
    top: -180, left: -180,
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute",
    width: 380, height: 380,
    borderRadius: "50%",
    background: "radial-gradient(circle, #fdba74, transparent 70%)",
    filter: "blur(80px)",
    opacity: 0.3,
    bottom: -120, right: -120,
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    zIndex: 1,
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.6)",
    borderRadius: "1.5rem",
    boxShadow: "0 20px 60px -10px rgba(249,115,22,0.18), 0 4px 24px rgba(0,0,0,0.08)",
    padding: "3rem 3.5rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.25rem",
    maxWidth: 420,
    textAlign: "center",
  },
  iconWrap: {
    width: 80, height: 80,
    borderRadius: "50%",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#1f2937",
    margin: 0,
  },
  message: {
    fontSize: "0.9rem",
    color: "#6b7280",
    margin: 0,
    lineHeight: 1.6,
  },
  btn: {
    marginTop: "0.5rem",
    padding: "0.65rem 1.75rem",
    background: "linear-gradient(135deg, #f97316, #ea6a0a)",
    color: "#fff",
    border: "none",
    borderRadius: "0.75rem",
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
  },
};

export default App;