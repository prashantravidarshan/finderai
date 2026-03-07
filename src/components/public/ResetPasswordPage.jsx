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
      <section className="auth-card">
        <h1>{auth.resetPassword || "Reset password"}</h1>
        <p>{auth.forgotSubtitleOtp || "Enter OTP and set a new password."}</p>

        <form onSubmit={submit}>
          <input
            type="email"
            className={`auth-field ${fieldErrors.email ? "is-invalid" : ""}`.trim()}
            placeholder={auth.emailPlaceholder || "Email address"}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className={`auth-field ${fieldErrors.otp ? "is-invalid" : ""}`.trim()}
            placeholder={auth.otp || "OTP"}
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <input
            type="password"
            className={`auth-field ${fieldErrors.newPassword ? "is-invalid" : ""}`.trim()}
            placeholder={auth.newPasswordPlaceholder || "New password"}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
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
    </main>
  );
}
