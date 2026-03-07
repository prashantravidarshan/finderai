import React, { useState } from "react";
import { APP_MESSAGES } from "../../config/appConfig.js";

export default function ResetPasswordPage({ onResetPassword, onGoLogin, onGoForgot, errorMessage, copy }) {
  const auth = copy?.auth || APP_MESSAGES.en.auth;
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  async function submit(e) {
    e.preventDefault();
    setLocalError("");
    setSuccess("");
    setFieldErrors({});

    const em = email.trim();
    const code = otp.trim();
    const nextErrors = {};
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) nextErrors.email = true;
    if (!/^\d{4,12}$/.test(code)) nextErrors.otp = true;
    if (!newPassword || newPassword.length < 8) nextErrors.newPassword = true;
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      setLocalError(auth.invalidOtpFields || "Enter valid email, OTP and password (8+ chars).");
      return;
    }

    try {
      setBusy(true);
      const data = await onResetPassword({ email: em, otp: code, new_password: newPassword });
      setSuccess(data?.message || auth.passwordResetDone || "Password reset successful.");
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
          <span className="auth-premium-eyebrow">Password reset</span>
          <h2>Securely reset and continue with zero friction.</h2>
          <p>Submit verified OTP, create a strong password, and go back to your workspace without losing flow.</p>
          <div className="auth-premium-chips">
            <span>Verified OTP</span>
            <span>Strong credentials</span>
            <span>Quick re-entry</span>
          </div>
          <ul className="auth-premium-points">
            <li>Validation checks in one step.</li>
            <li>Built for secure and fast recovery.</li>
            <li>Direct return to login after success.</li>
          </ul>
        </aside>

        <section className="auth-card auth-premium-form">
          <h1>{auth.resetPassword || "Reset password"}</h1>
          <p>{auth.forgotSubtitleOtp || "Enter OTP and set a new password."}</p>

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
            <div className={`auth-input ${fieldErrors.otp ? "is-invalid" : ""}`.trim()}>
              <span className="auth-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9h12M6 13h12M6 17h7" />
                </svg>
              </span>
              <input
                className="auth-field"
                placeholder={auth.otp || "OTP"}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <div className={`auth-input ${fieldErrors.newPassword ? "is-invalid" : ""}`.trim()}>
              <span className="auth-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="6" y="10" width="12" height="10" rx="2" />
                  <path d="M9 10V7a3 3 0 0 1 6 0v3" />
                </svg>
              </span>
              <input
                type="password"
                className="auth-field"
                placeholder={auth.newPasswordPlaceholder || "New password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? (auth.resettingPassword || "Resetting...") : (auth.resetPassword || "Reset password")}
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
              {auth.sendOtp || "Request OTP"}
            </a>
            <a
              className="auth-link"
              href="#/login"
              onClick={(e) => {
                e.preventDefault();
                onGoLogin();
              }}
            >
              {auth.backToLogin || "Back to login"}
            </a>
          </div>

          {success ? <div className="auth-success">{success}</div> : null}
          {localError ? <div className="auth-error">{localError}</div> : null}
          {errorMessage ? <div className="auth-error">{errorMessage}</div> : null}
        </section>
      </section>
    </main>
  );
}
