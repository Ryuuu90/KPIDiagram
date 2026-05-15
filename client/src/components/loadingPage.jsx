import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import finansiaLogo from '../public/finansia-logo.png';

// Steps are now handled inside the component with t()

const ChartIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
);

export default function LoadingPage() {
  const { t } = useTranslation();
  const STEPS = [
    t('loading.step1'),
    t('loading.step2'),
    t('loading.step3'),
    t('loading.step4'),
    t('loading.step5'),
  ];
  const [stepIndex, setStepIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setStepIndex((i) => (i + 1) % STEPS.length);
        setFadeIn(true);
      }, 300);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.root}>
      {/* background blobs */}
      <div style={{ ...styles.blob, ...styles.blob1 }} />
      <div style={{ ...styles.blob, ...styles.blob2 }} />
      <div style={{ ...styles.blob, ...styles.blob3 }} />

      <style>{css}</style>

      <div style={styles.wrapper}>
        <div className="loading-card">

          {/* logo */}
          <img className="rounded-full w-64" src={finansiaLogo} alt="Finansia" />

          {/* spinner */}
          <div style={styles.spinnerWrap}>
            <div style={styles.ringTrack} />
            <div className="ring-spin" />
            <div className="spinner-icon" style={styles.spinnerIcon}>
              <ChartIcon />
            </div>
          </div>

          {/* titles */}

          {/* bouncing dots */}
          <div style={styles.dots}>
            <div className="dot dot-1" />
            <div className="dot dot-2" />
            <div className="dot dot-3" />
          </div>

          {/* progress bar */}

          {/* cycling step label */}
          <p
            style={{
              ...styles.stepLabel,
              opacity: fadeIn ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          >
            {STEPS[stepIndex]}
          </p>

        </div>
      </div>
    </div>
  );
}

/* ─── inline styles ─────────────────────────────────────────── */
const styles = {
  root: {
    position: "relative",
    width: "100%",
    height: "100vh",
    background: "#fef3e8",
    overflow: "hidden",
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  },
  blob: {
    position: "absolute",
    borderRadius: "50%",
    filter: "blur(80px)",
    opacity: 0.35,
    pointerEvents: "none",
    zIndex: 0,
  },
  blob1: {
    width: 520, height: 520,
    background: "radial-gradient(circle, #fb923c, #f97316 60%, transparent)",
    top: -160, left: -160,
  },
  blob2: {
    width: 400, height: 400,
    background: "radial-gradient(circle, #fdba74, #f97316 50%, transparent)",
    bottom: -120, right: -120,
  },
  blob3: {
    width: 280, height: 280,
    background: "radial-gradient(circle, #fed7aa, transparent 70%)",
    top: "40%", left: "55%",
  },
  wrapper: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
  },
  logo: {
    display: "block",
    height: 52,
    width: "auto",
    maxWidth: 180,
    objectFit: "contain",
    background: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    padding: "8px 18px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
  },
  spinnerWrap: {
    position: "relative",
    width: 80,
    height: 80,
  },
  ringTrack: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    border: "5px solid #ffedd5",
  },
  spinnerIcon: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#f97316",
  },
  title: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#1f2937",
    letterSpacing: "-0.3px",
    margin: 0,
  },
  subtitle: {
    fontSize: "0.85rem",
    color: "#9ca3af",
    marginTop: 4,
    margin: "4px 0 0",
  },
  dots: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  progressWrap: {
    width: 220,
    height: 4,
    background: "#ffedd5",
    borderRadius: 9999,
    overflow: "hidden",
  },
  stepLabel: {
    fontSize: "0.75rem",
    color: "#9ca3af",
    textAlign: "center",
    minHeight: "1.1em",
    letterSpacing: "0.01em",
  },
};

/* ─── keyframe animations (injected once) ───────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  .loading-card {
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(24px) saturate(1.4);
    -webkit-backdrop-filter: blur(24px) saturate(1.4);
    border: 1px solid rgba(255,255,255,0.55);
    border-radius: 1.5rem;
    box-shadow: 0 20px 60px -10px rgba(249,115,22,0.18), 0 4px 24px rgba(0,0,0,0.08);
    padding: 3rem 3.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    min-width: 340px;
    animation: cardIn 0.5s cubic-bezier(.22,1,.36,1) both;
  }

  @keyframes cardIn {
    from { opacity:0; transform:translateY(20px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }

  .ring-spin {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 5px solid transparent;
    border-top-color: #f97316;
    border-right-color: #fb923c;
    animation: spin 0.9s cubic-bezier(0.5,0,0.5,1) infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .spinner-icon svg {
    animation: pulse 1.8s ease-in-out infinite;
  }
  @keyframes pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%      { opacity:0.6; transform:scale(0.88); }
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: bounce 1.2s ease-in-out infinite;
  }
  .dot-1 { background:#fb923c; animation-delay:0s; }
  .dot-2 { background:#f97316; animation-delay:0.18s; }
  .dot-3 { background:#ea6a0a; animation-delay:0.36s; }
  @keyframes bounce {
    0%,60%,100% { transform:translateY(0); opacity:0.6; }
    30%          { transform:translateY(-8px); opacity:1; }
  }

  .progress-bar {
    height: 100%;
    border-radius: 9999px;
    background: linear-gradient(90deg, #fb923c, #ea6a0a);
    animation: progress 2.4s cubic-bezier(0.4,0,0.2,1) infinite;
    transform-origin: left;
  }
  @keyframes progress {
    0%   { width:0%;   opacity:1; }
    70%  { width:90%;  opacity:1; }
    85%  { width:95%;  opacity:0.8; }
    100% { width:100%; opacity:0; }
  }
`;