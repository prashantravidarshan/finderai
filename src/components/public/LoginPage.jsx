import React, { useState } from "react";
import { APP_MESSAGES } from "../../config/appConfig.js";

export default function LoginPage({ onLogin, onGoSignup, onGoForgot, errorMessage, copy }) {
  const auth = copy?.auth || APP_MESSAGES.en.auth;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  async function submit(e) {
    e.preventDefault();
    setLocalError("");
    setFieldErrors({});
    const em = email.trim();
    const nextErrors = {};
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) nextErrors.email = true;
    if (!password) nextErrors.password = true;
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      setLocalError(auth.invalidLoginFields || "Email and password are required.");
      return;
    }
    try {
      setBusy(true);
      await onLogin({ email: em, password });
    } catch {
      // handled by parent error state
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-main auth-main-single">
      <section className="auth-premium-shell">
        <aside className="auth-premium-content" aria-hidden="true">
          <span className="auth-premium-eyebrow">AI file workspace</span>
          <h2>From one prompt to verified output in seconds.</h2>
          <p>Search, extract, improve, organize, and prepare share-ready delivery across connected sources with one reliable flow.</p>
          <div className="auth-premium-chips">
            <span>Intent aware</span>
            <span>Connected retrieval</span>
            <span>Draft + delivery</span>
          </div>
          <ul className="auth-premium-points">
            <li>Works on hints, not only file names.</li>
            <li>Finds details from text, scans, and media content.</li>
            <li>Prepares communication with attachment context.</li>
          </ul>
        </aside>

        <section className="auth-card auth-premium-form">
          <h1>{auth.loginTitle || "Welcome back"}</h1>
          <p>{auth.loginSubtitle || "Sign in to continue."}</p>

          <form onSubmit={submit}>
            <div className={`auth-input ${fieldErrors.email ? "is-invalid" : ""}`.trim()}>
              <span className="auth-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16v12H4z" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
              </span>
              <input
                type="email"
                className="auth-field"
                placeholder={auth.emailPlaceholder || "Email address"}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className={`auth-input ${fieldErrors.password ? "is-invalid" : ""}`.trim()}>
              <span className="auth-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="6" y="10" width="12" height="10" rx="2" />
                  <path d="M9 10V7a3 3 0 0 1 6 0v3" />
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="auth-field"
                placeholder={auth.passwordPlaceholder || "Password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-input-action"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? (auth.signingIn || "Signing in...") : (auth.signIn || "Sign in")}
            </button>
          </form>

          <div className="auth-links auth-links-split">
            <a
              className="auth-link"
              href="#/forgot-password"
              onClick={(e) => {
                e.preventDefault();
                onGoForgot();
              }}
            >
              {auth.forgotPassword || "Forgot password?"}
            </a>
            <a
              className="auth-link"
              href="#/signup"
              onClick={(e) => {
                e.preventDefault();
                onGoSignup();
              }}
            >
              {auth.createAccountLink || "Create account"}
            </a>
          </div>

          {localError ? <div className="auth-error">{localError}</div> : null}
          {errorMessage ? <div className="auth-error">{errorMessage}</div> : null}
        </section>
      </section>
    </main>
  );
}
