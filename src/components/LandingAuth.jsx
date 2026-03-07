import React, { useMemo, useState } from "react";
import ThemeToggle from "./ui/ThemeToggle.jsx";

export default function LandingAuth({ onLogin, onRegister, status, theme, onToggleTheme }) {
  const [activePane, setActivePane] = useState("register");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");

  const passwordChecks = useMemo(() => {
    const p = registerPassword || "";
    return [
      { label: "8+ characters", ok: p.length >= 8 },
      { label: "Upper + lower case", ok: /[A-Z]/.test(p) && /[a-z]/.test(p) },
      { label: "At least 1 number", ok: /\d/.test(p) },
    ];
  }, [registerPassword]);

  async function submitLogin() {
    setActivePane("login");
    setLoginError("");

    const email = loginEmail.trim();
    if (!email || !loginPassword) {
      setLoginError("Email and password are required.");
      return;
    }

    try {
      await onLogin({ email, password: loginPassword });
    } catch (e) {
      setLoginError(e?.message || "Unable to sign in.");
    }
  }

  async function submitRegister() {
    setActivePane("register");
    setRegisterError("");

    const email = registerEmail.trim();
    const name = fullName.trim();
    if (!name) {
      setRegisterError("Full name is required.");
      return;
    }
    if (!email || !registerPassword) {
      setRegisterError("Email and password are required.");
      return;
    }
    if (registerPassword !== confirmPassword) {
      setRegisterError("Password and confirm password must match.");
      return;
    }
    if (passwordChecks.some((x) => !x.ok)) {
      setRegisterError("Password requirements are not complete.");
      return;
    }

    try {
      await onRegister({ email, password: registerPassword, full_name: name });
    } catch (e) {
      setRegisterError(e?.message || "Unable to create account.");
    }
  }

  return (
    <div className="landing-root">
      <div className="landing-grid-pattern" />
      <div className="landing-glow landing-glow-a" />
      <div className="landing-glow landing-glow-b" />

      <div className="landing-inner">
        <header className="landing-top">
          <div className="landing-brand">
            <div className="landing-brand-mark">FQ</div>
            <div>
              <div className="landing-brand-name">Fyndoy</div>
              <div className="landing-brand-sub">SMART FINDER</div>
            </div>
          </div>

          <div className="landing-actions">
            <button
              className={`landing-top-btn ${activePane === "login" ? "is-active" : ""}`}
              onClick={() => setActivePane("login")}
            >
              Sign in
            </button>
            <button
              className={`landing-top-btn landing-top-btn-primary ${activePane === "register" ? "is-active" : ""}`}
              onClick={() => setActivePane("register")}
            >
              Get started
            </button>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </header>

        <main className="landing-main">
          <section className="landing-hero">
            <div className="landing-eyebrow">Private file intelligence</div>
            <h1 className="landing-title">Search less. Find faster.</h1>
            <p className="landing-copy">
              Connect local folders and ask naturally.
              Fyndoy returns the exact file with preview and download.
            </p>

            <div className="landing-feature-row">
              <div className="landing-feature-chip">Real-time indexing</div>
              <div className="landing-feature-chip">Smart matching</div>
              <div className="landing-feature-chip">Secure access</div>
            </div>

            <div className="landing-demo-card">
              <div className="landing-demo-label">Example query</div>
              <div className="landing-demo-text">Show Prashant Aadhaar</div>
            </div>
          </section>

          <section className="landing-auth-grid">
            <article className={`landing-auth-card ${activePane === "login" ? "active" : ""}`}>
              <h2>Sign in</h2>
              <p>Access your workspace.</p>

              <input
                className="landing-field"
                placeholder="Email address"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <input
                type="password"
                className="landing-field"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />

              <button className="landing-auth-submit" onClick={submitLogin}>Sign in</button>
              {loginError ? <div className="landing-error">{loginError}</div> : null}
            </article>

            <article className={`landing-auth-card ${activePane === "register" ? "active" : ""}`}>
              <h2>Create account</h2>
              <p>Start in under a minute.</p>

              <input
                className="landing-field"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <input
                className="landing-field"
                placeholder="Email address"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
              />
              <input
                type="password"
                className="landing-field"
                placeholder="Password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
              />
              <input
                type="password"
                className="landing-field"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <div className="landing-password-box">
                {passwordChecks.map((c) => (
                  <div key={c.label} className={c.ok ? "ok" : "bad"}>
                    <span>{c.ok ? "OK" : "--"}</span>
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>

              <button className="landing-auth-submit" onClick={submitRegister}>Create account</button>
              {registerError ? <div className="landing-error">{registerError}</div> : null}
            </article>
          </section>
        </main>

        {status ? <div className="landing-status">{status}</div> : null}
      </div>
    </div>
  );
}
