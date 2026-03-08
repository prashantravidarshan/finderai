import React, { useMemo, useState } from "react";
import { APP_MESSAGES } from "../../config/appConfig.js";

export default function SignupPage({ onSignup, onGoLogin, errorMessage, copy }) {
  const auth = copy?.auth || APP_MESSAGES.en.auth;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const checks = useMemo(() => {
    const c = auth.passwordChecks || APP_MESSAGES.en.auth.passwordChecks;
    return [
      { label: c.chars || "8+ characters", ok: password.length >= 8 },
      { label: c.case || "Upper + lower case", ok: /[A-Z]/.test(password) && /[a-z]/.test(password) },
      { label: c.number || "At least 1 number", ok: /\d/.test(password) },
    ];
  }, [auth.passwordChecks, password]);

  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 40;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 30;
    if (/\d/.test(password)) score += 30;
    return Math.min(100, score);
  }, [password]);

  async function submit(e) {
    e.preventDefault();
    setLocalError("");
    setFieldErrors({});

    const name = fullName.trim();
    const em = email.trim();
    const nextErrors = {};
    if (!name) nextErrors.fullName = true;
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) nextErrors.email = true;
    if (!password) nextErrors.password = true;
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      setLocalError(auth.invalidSignupFields || "Full name, email and password are required.");
      return;
    }
    if (checks.some((c) => !c.ok)) {
      setFieldErrors((prev) => ({ ...prev, password: true }));
      setLocalError(auth.invalidPasswordRules || "Password requirements are not complete.");
      return;
    }

    try {
      setBusy(true);
      await onSignup({ full_name: name, email: em, password });
    } catch {
      // handled by parent
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-main auth-main-single">
      <section className="auth-premium-shell">
        <aside className="auth-premium-content" aria-hidden="true">
          <span className="auth-premium-eyebrow">Private AI workspace</span>
          <h2>Create a secure AI workspace.</h2>
          <p>One secure environment to search across connected sources, extract accurate details, and generate communication-ready outputs.</p>
          <div className="auth-premium-chips">
            <span>Unified sources</span>
            <span>Semantic retrieval</span>
            <span>Action-ready drafts</span>
          </div>
          <div className="auth-premium-signals">
            <span><i />Access control</span>
            <span><i />Source sync</span>
            <span><i />Workflow ready</span>
          </div>
          <ul className="auth-premium-points">
            <li>Interprets request context before retrieval starts.</li>
            <li>Improves unclear content and extracts usable evidence.</li>
            <li>Builds share-ready drafts with attachment awareness.</li>
          </ul>
          <div className="auth-premium-minirow">
            <span>Enterprise</span>
            <span>SMB</span>
            <span>Teams</span>
            <span>Studio</span>
          </div>
        </aside>

        <section className="auth-card auth-premium-form">
          <h1>{auth.signupTitle || "Create account"}</h1>
          <p>{auth.signupSubtitle || "Start your private workspace."}</p>

          <form onSubmit={submit}>
            <div className={`auth-input ${fieldErrors.fullName ? "is-invalid" : ""}`.trim()}>
              <span className="auth-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20a7 7 0 0 1 14 0" />
                </svg>
              </span>
              <input
                className="auth-field"
                placeholder={auth.fullNamePlaceholder || "Full name"}
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
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
                autoComplete="new-password"
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

            <div className="auth-strength">
              <div className="auth-strength-bar" style={{ width: `${strength}%` }} />
            </div>

            <div className="auth-checks">
              {checks.map((c) => (
                <div key={c.label} className={c.ok ? "ok" : "bad"}>
                  <span>{c.ok ? (auth.passwordChecks?.ok || APP_MESSAGES.en.auth.passwordChecks.ok || "OK") : (auth.passwordChecks?.pending || APP_MESSAGES.en.auth.passwordChecks.pending || "--")}</span>
                  <span>{c.label}</span>
                </div>
              ))}
            </div>

            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? (auth.creating || "Creating...") : (auth.createAccount || "Create account")}
            </button>
          </form>

          <div className="auth-links">
            <span className="auth-link-inline">
              {(auth.alreadyAccount || "Already have an account?")}{" "}
              <a
                className="auth-link"
                href="#/login"
                onClick={(e) => {
                  e.preventDefault();
                  onGoLogin();
                }}
              >
                {auth.signIn || "Sign in"}
              </a>
            </span>
          </div>

          {localError ? <div className="auth-error">{localError}</div> : null}
          {errorMessage ? <div className="auth-error">{errorMessage}</div> : null}
        </section>
      </section>

    </main>
  );
}
