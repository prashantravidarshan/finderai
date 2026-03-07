import React, { useEffect, useRef, useState } from "react";
import { APP_MESSAGES } from "../../config/appConfig.js";

const OTP_LEN = 6;

export default function ForgotPasswordPage({ onRequestOtp, onVerifyOtp, onResetPassword, onGoLogin, errorMessage, copy }) {
  const auth = copy?.auth || APP_MESSAGES.en.auth;
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(Array.from({ length: OTP_LEN }, () => ""));
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [resendIn, setResendIn] = useState(0);
  const timerRef = useRef(null);
  const otpRefs = useRef([]);

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  useEffect(() => {
    return () => clearTimer();
  }, []);

  function startResendCountdown(seconds = 30) {
    clearTimer();
    setResendIn(seconds);
    timerRef.current = setInterval(() => {
      setResendIn((v) => {
        if (v <= 1) {
          clearTimer();
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }

  async function requestOtp(e) {
    if (e) e.preventDefault();
    setLocalError("");
    setMessage("");
    setFieldErrors({});
    const em = email.trim();
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setFieldErrors({ email: true });
      setLocalError(auth.invalidEmail || "Enter a valid email address.");
      return;
    }
    try {
      setBusy(true);
      const data = await onRequestOtp({ email: em });
      setMessage(data?.message || auth.otpSent || "OTP sent. Check your registered channel.");
      setStep("otp");
      setOtp(Array.from({ length: OTP_LEN }, () => ""));
      setNewPassword("");
      startResendCountdown(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch {
      // parent handles
    } finally {
      setBusy(false);
    }
  }

  function updateOtp(index, value) {
    const digit = (value || "").replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LEN - 1) otpRefs.current[index + 1]?.focus();
  }

  function onOtpKeyDown(index, e) {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LEN - 1) otpRefs.current[index + 1]?.focus();
  }

  function onOtpPaste(e) {
    e.preventDefault();
    const txt = (e.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, OTP_LEN);
    if (!txt) return;
    const next = Array.from({ length: OTP_LEN }, (_, i) => txt[i] || "");
    setOtp(next);
    otpRefs.current[Math.min(txt.length, OTP_LEN - 1)]?.focus();
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setLocalError("");
    setMessage("");
    setFieldErrors({});

    const em = email.trim();
    const code = otp.join("").trim();
    const nextErrors = {};
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) nextErrors.email = true;
    if (!/^\d{6}$/.test(code)) nextErrors.otp = true;
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      setLocalError(auth.invalidOtpFields || "Enter valid OTP and strong password (8+ chars).");
      return;
    }

    try {
      setBusy(true);
      await onVerifyOtp?.({ email: em, otp: code });
      setStep("reset");
    } catch {
      // parent handles
    } finally {
      setBusy(false);
    }
  }

  async function submitReset(e) {
    e.preventDefault();
    setLocalError("");
    setMessage("");
    setFieldErrors({});

    const em = email.trim();
    const code = otp.join("").trim();
    const nextErrors = {};
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) nextErrors.email = true;
    if (!/^\d{6}$/.test(code)) nextErrors.otp = true;
    if (!newPassword || newPassword.length < 8) nextErrors.newPassword = true;
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      setLocalError(auth.invalidOtpFields || "Enter valid OTP and strong password (8+ chars).");
      return;
    }

    try {
      setBusy(true);
      const data = await onResetPassword({ email: em, otp: code, new_password: newPassword });
      setMessage(data?.message || auth.passwordResetDone || "Password reset successful. Please login.");
      setStep("done");
      clearTimer();
    } catch {
      // parent handles
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-main auth-main-single">
      <section className="auth-card">
        <h1>{auth.forgotTitle || "Forgot password"}</h1>
        <p>{step === "email" ? (auth.forgotSubtitleEmail || "Enter your email to receive OTP.") : (auth.forgotSubtitleOtp || "Enter OTP and set new password.")}</p>

        {step === "email" ? (
          <form onSubmit={requestOtp}>
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
            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? (auth.sendingOtp || "Sending...") : (auth.sendOtp || "Send OTP")}
            </button>
          </form>
        ) : step === "otp" ? (
          <form onSubmit={verifyOtp}>
            <div className="auth-email-display">
              <span>{email || "-"}</span>
              <button
                type="button"
                className="auth-link"
                onClick={() => setStep("email")}
              >
                {auth.editEmail || "Edit"}
              </button>
            </div>
            <div className={`otp-row ${fieldErrors.otp ? "is-invalid" : ""}`.trim()} onPaste={onOtpPaste}>
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  className={`otp-box ${fieldErrors.otp ? "is-invalid" : ""}`.trim()}
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={d}
                  onChange={(e) => updateOtp(i, e.target.value)}
                  onKeyDown={(e) => onOtpKeyDown(i, e)}
                />
              ))}
            </div>

            <div className="auth-otp-actions">
              <button
                type="button"
                className="auth-link"
                disabled={busy || resendIn > 0}
                onClick={() => requestOtp()}
              >
                {resendIn > 0 ? `${auth.resendIn || "Resend OTP in"} ${resendIn}s` : (auth.resendOtp || "Resend OTP")}
              </button>
            </div>

            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? (auth.verifying || "Verifying...") : (auth.verifyOtp || "Verify OTP")}
            </button>
          </form>
        ) : step === "reset" ? (
          <form onSubmit={submitReset}>
            <div className="auth-email-display">
              <span>{email || "-"}</span>
              <button
                type="button"
                className="auth-link"
                onClick={() => setStep("email")}
              >
                {auth.editEmail || "Edit"}
              </button>
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
        ) : (
          <div className="auth-success">{auth.passwordResetDone || "Password reset successful. Continue to login."}</div>
        )}

        <div className="auth-links">
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

        {message ? <div className="auth-success">{message}</div> : null}
        {localError ? <div className="auth-error">{localError}</div> : null}
        {errorMessage ? <div className="auth-error">{errorMessage}</div> : null}
      </section>
    </main>
  );
}
