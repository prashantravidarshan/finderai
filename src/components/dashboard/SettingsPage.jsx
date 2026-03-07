import React, { useEffect, useMemo, useState } from "react";
import { apiJson } from "../../api/client.js";
import { useLocalStorage } from "../../hooks/useLocalStorage.js";
import { APP_COUNTRY_OPTIONS, APP_MESSAGES, APP_SETTINGS_TABS } from "../../config/appConfig.js";

function fmt(ts) {
  if (ts == null || ts === "") return "-";
  if (typeof ts === "number") {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return String(ts);
    return d.toLocaleString();
  }
  if (ts instanceof Date) {
    if (Number.isNaN(ts.getTime())) return "-";
    return ts.toLocaleString();
  }
  const raw = typeof ts === "string" ? ts : String(ts);
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const withZone = /Z$|[+-]\d\d:\d\d$/.test(normalized) ? normalized : `${normalized}Z`;
  const d = new Date(withZone);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString();
}

function normalizeTimezone(tz) {
  if (!tz || typeof tz !== "string") {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  }
  return tz;
}

function readLocalJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export default function SettingsPage({
  token,
  copy,
  themeMode = "system",
  onThemeMode,
  themeModes = [],
  colorTheme = "default",
  onColorTheme,
  colorThemes = [],
  fontSize = "default",
  onFontSize,
  fontSizes = [],
  fontPreset = "default",
  onFontPreset,
  fontPresets = [],
  locale = "en",
  onLocale,
  locales = [],
  searchMode = "balanced",
  onSearchMode,
  searchModes = [],
  fileTypePrefs = {},
  onToggleFileType,
  fileTypeOptions = [],
  cacheMode = "normal",
  onCacheMode,
  cacheModes = [],
  notificationPrefs = {},
  onToggleNotification,
  notificationOptions = [],
  autoLock = "off",
  onAutoLock,
  autoLockOptions = [],
  onLogout,
}) {
  const text = copy?.settings || APP_MESSAGES.en.settings;
  const common = text.common || APP_MESSAGES.en.settings.common;

  const [activeTab, setActiveTab] = useLocalStorage("fyndoy_settings_tab", "profile");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [indexStatus, setIndexStatus] = useState({ roots: [] });
  const [profileBusy, setProfileBusy] = useState(false);
  const [sourceBusy, setSourceBusy] = useState(false);
  const [dataBusy, setDataBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [sourcePath, setSourcePath] = useState("");
  const [showAllColors, setShowAllColors] = useState(false);
  const [changePwdBusy, setChangePwdBusy] = useState(false);
  const [changePwd, setChangePwd] = useState({ current: "", next: "", confirm: "" });
  const [changePwdError, setChangePwdError] = useState("");

  const [profileExtras, setProfileExtras] = useLocalStorage("fyndoy_profile_extras", {
    country: "",
    timezone: normalizeTimezone(""),
    language: locale || "en",
  });
  const [sessionStartedAt] = useLocalStorage("fyndoy_session_started_at", new Date().toISOString());
  const [archivedChats, setArchivedChats] = useState(() => readLocalJson("fyndoy_archived_chats", []));

  const timezoneOptions = useMemo(() => {
    if (typeof Intl?.supportedValuesOf === "function") {
      try {
        return Intl.supportedValuesOf("timeZone");
      } catch {
        // ignore
      }
    }
    return ["UTC", "Asia/Kolkata", "Europe/Berlin", "America/New_York", "America/Los_Angeles"];
  }, []);

  const tabs = useMemo(() => {
    const labels = {
      profile: text.profile?.title,
      appearance: text.appearance?.title,
      sources: text.sources?.title,
      search: text.search?.title,
      notifications: text.notifications?.title,
      security: text.security?.title,
      data: text.data?.title,
    };
    return APP_SETTINGS_TABS.map((item) => ({
      ...item,
      label: labels[item.id] || item.label,
    }));
  }, [text]);

  useEffect(() => {
    if (!tabs.some((t) => t.id === activeTab)) {
      setActiveTab("profile");
    }
  }, [activeTab, setActiveTab, tabs]);

  async function load() {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [profileData, sourceData] = await Promise.all([
        apiJson("/api/auth/profile", { token }),
        apiJson("/api/index/status", { token }),
      ]);
      setEmail(profileData.email || "");
      setFullName(profileData.full_name || "");
      setCreatedAt(profileData.created_at || "");
      setIndexStatus(sourceData || { roots: [] });
      setStatus("");
    } catch (e) {
      if (!shouldIgnoreStatusMessage(e.message)) setStatus(e.message || common.failed);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === "fyndoy_archived_chats") {
        setArchivedChats(readLocalJson("fyndoy_archived_chats", []));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    setProfileExtras((prev) => ({
      country: prev?.country || "",
      timezone: normalizeTimezone(prev?.timezone),
      language: prev?.language || locale || "en",
    }));
  }, [locale, setProfileExtras]);

  function shouldIgnoreStatusMessage(msg) {
    const s = String(msg || "").toLowerCase();
    return s.includes("user cancelled") || s.includes("folder selection cancelled") || s.includes("-128");
  }

  async function saveProfile(e) {
    e.preventDefault();
    if (!token) return;
    setProfileBusy(true);
    try {
      const data = await apiJson("/api/auth/profile", {
        method: "PATCH",
        token,
        body: { full_name: fullName.trim() },
      });
      setFullName(data.full_name || "");
      if (profileExtras.language && profileExtras.language !== locale) {
        onLocale?.(profileExtras.language);
      }
    } catch (e) {
      if (!shouldIgnoreStatusMessage(e.message)) setStatus(e.message || common.failed);
    } finally {
      setProfileBusy(false);
    }
  }

  async function browseFolder() {
    if (!token) return;
    try {
      setSourceBusy(true);
      const data = await apiJson("/api/index/browse", { method: "POST", token, body: {} });
      if (data?.root_path) setSourcePath(data.root_path);
    } catch (e) {
      const msg = String(e.message || "");
      if (!/cancel|user cancelled|folder selection cancelled|-\d+/.test(msg.toLowerCase())) {
        setStatus(msg || common.failed);
      }
    } finally {
      setSourceBusy(false);
    }
  }

  async function submitChangePassword(e) {
    e.preventDefault();
    if (!token) return;
    setChangePwdError("");
    const current = changePwd.current.trim();
    const next = changePwd.next.trim();
    const confirm = changePwd.confirm.trim();
    if (!current || !next || next.length < 8 || next !== confirm) {
      setChangePwdError(common.failed || "Please check password fields.");
      return;
    }
    try {
      setChangePwdBusy(true);
      await apiJson("/api/auth/change-password", {
        method: "POST",
        token,
        body: { current_password: current, new_password: next },
      });
      setChangePwd({ current: "", next: "", confirm: "" });
      setStatus(text.security?.passwordChanged || "Password updated.");
    } catch (e) {
      setChangePwdError(e.message || common.failed);
    } finally {
      setChangePwdBusy(false);
    }
  }

  async function connectFolder() {
    if (!token || !sourcePath.trim()) return;
    try {
      setSourceBusy(true);
      await apiJson("/api/index/connect", {
        method: "POST",
        token,
        body: { root_path: sourcePath.trim() },
      });
      await load();
      setSourcePath("");
      setStatus(text.sources?.connectedOk || common.success);
    } catch (e) {
      if (!shouldIgnoreStatusMessage(e.message)) setStatus(e.message || common.failed);
    } finally {
      setSourceBusy(false);
    }
  }

  async function resyncFolder(rootPath) {
    if (!token) return;
    try {
      setSourceBusy(true);
      await apiJson("/api/index/resync", { method: "POST", token, body: { root_path: rootPath } });
      await load();
      setStatus(text.sources?.resyncedOk || common.success);
    } catch (e) {
      if (!shouldIgnoreStatusMessage(e.message)) setStatus(e.message || common.failed);
    } finally {
      setSourceBusy(false);
    }
  }

  async function removeFolder(rootPath) {
    if (!token) return;
    try {
      setSourceBusy(true);
      await apiJson("/api/index/remove", { method: "POST", token, body: { root_path: rootPath } });
      await load();
      setStatus(text.sources?.removedOk || common.success);
    } catch (e) {
      if (!shouldIgnoreStatusMessage(e.message)) setStatus(e.message || common.failed);
    } finally {
      setSourceBusy(false);
    }
  }

  async function resyncAllFolders() {
    if (!token) return;
    const roots = indexStatus?.roots || [];
    if (!roots.length) return;
    try {
      setSourceBusy(true);
      await Promise.all(roots.map((r) => apiJson("/api/index/resync", { method: "POST", token, body: { root_path: r.root_path } })));
      await load();
      setStatus(text.sources?.allResyncedOk || common.success);
    } catch (e) {
      if (!shouldIgnoreStatusMessage(e.message)) setStatus(e.message || common.failed);
    } finally {
      setSourceBusy(false);
    }
  }

  async function exportChats() {
    if (!token) return;
    try {
      setDataBusy(true);
      const conv = await apiJson("/api/conversations", { token });
      const rows = conv.conversations || [];
      const payload = await Promise.all(
        rows.map(async (c) => {
          const detail = await apiJson(`/api/chats/${c.conversation_id}`, { token });
          return {
            conversation_id: c.conversation_id,
            title: c.title,
            last_time: c.last_time,
            messages: detail.messages || [],
          };
        })
      );
      const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), chats: payload }, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fyndoy-chats-export.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus(text.data?.exportedOk || common.success);
    } catch (e) {
      if (!shouldIgnoreStatusMessage(e.message)) setStatus(e.message || common.failed);
    } finally {
      setDataBusy(false);
    }
  }

  async function deleteAllChats() {
    if (!token) return;
    try {
      setDataBusy(true);
      const conv = await apiJson("/api/conversations", { token });
      const rows = conv.conversations || [];
      await Promise.all(rows.map((c) => apiJson(`/api/conversations/${c.conversation_id}`, { method: "DELETE", token })));
      setStatus(text.data?.deletedAllOk || common.success);
    } catch (e) {
      if (!shouldIgnoreStatusMessage(e.message)) setStatus(e.message || common.failed);
    } finally {
      setDataBusy(false);
    }
  }

  function clearSearchHistory() {
    try {
      localStorage.removeItem("calenox_messages");
      setStatus(text.data?.clearedHistoryOk || common.success);
    } catch {
      setStatus(common.failed);
    }
  }

  function clearCache() {
    try {
      localStorage.removeItem("fyndoy_pinned_chats");
      localStorage.removeItem("calenox_conversation_id");
      localStorage.removeItem("calenox_messages");
      setStatus(text.data?.clearedCacheOk || common.success);
    } catch {
      setStatus(common.failed);
    }
  }

  function unarchiveConversation(id) {
    const next = archivedChats.filter((x) => x !== id);
    setArchivedChats(next);
    localStorage.setItem("fyndoy_archived_chats", JSON.stringify(next));
  }

  function renderProfileTab() {
    return (
      <div className="settings-v2-section">
        <h2>{text.profile?.title || "Profile"}</h2>
        <p>{text.profile?.hint || "Basic identity and regional preferences."}</p>

        <form onSubmit={saveProfile} className="settings-v2-form-grid">
          <div>
            <label>{text.profile?.fullName || "Full name"} *</label>
            <div className="settings-input">
              <span className="settings-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20a7 7 0 0 1 14 0" />
                </svg>
              </span>
              <input
                className="settings-field"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={copy?.auth?.fullNamePlaceholder || APP_MESSAGES.en.auth.fullNamePlaceholder}
              />
            </div>
          </div>

          <div>
            <label>{text.profile?.email || "Email"}</label>
            <div className="settings-input settings-input-readonly">
              <span className="settings-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16v12H4z" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
              </span>
              <div className="settings-readonly">{email || "-"}</div>
            </div>
          </div>

          <div>
            <label>{text.profile?.country || "Country / Region"}</label>
            <select
              className="settings-field"
              value={profileExtras.country || ""}
              onChange={(e) => setProfileExtras((prev) => ({ ...prev, country: e.target.value }))}
            >
              <option value="">{text.profile?.selectPlaceholder || "Select"}</option>
              {APP_COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <div>
            <label>{text.profile?.timezone || "Time zone"}</label>
            <select
              className="settings-field"
              value={profileExtras.timezone || ""}
              onChange={(e) => setProfileExtras((prev) => ({ ...prev, timezone: e.target.value }))}
            >
              {timezoneOptions.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <div>
            <label>{text.profile?.language || "App language"}</label>
            <select
              className="settings-field"
              value={profileExtras.language || locale}
              onChange={(e) => setProfileExtras((prev) => ({ ...prev, language: e.target.value }))}
            >
              {locales.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.flag} {lang.name} ({lang.code})</option>
              ))}
            </select>
          </div>

          <div className="settings-v2-actions-row">
            <button className="settings-save" type="submit" disabled={profileBusy || !token}>
              {profileBusy ? (text.profile?.saving || "Saving...") : (text.profile?.save || "Save profile")}
            </button>
          </div>
        </form>
      </div>
    );
  }

  function renderAppearanceTab() {
    return (
      <div className="settings-v2-section">
        <h2>{text.appearance?.title || "Appearance"}</h2>
        <p>{text.appearance?.hint || "Personalize theme, accent, and typography."}</p>

        <label>{text.appearance?.theme || "Theme"}</label>
        <div className="settings-chip-list">
          {themeModes.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`settings-chip ${themeMode === item.id ? "is-selected" : ""}`}
              onClick={() => onThemeMode?.(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label>{text.appearance?.accent || "Accent color"}</label>
        <div className="settings-color-grid">
          {(showAllColors ? colorThemes : colorThemes.slice(0, 10)).map((item) => (
            <button
              key={item.id}
              type="button"
              className={`settings-color-item ${colorTheme === item.id ? "is-selected" : ""}`}
              onClick={() => onColorTheme?.(item.id)}
            >
              <span className="settings-color-dot" style={{ background: item.accent }} />
              <span>{item.label}</span>
            </button>
          ))}
          {colorThemes.length > 10 ? (
            <button type="button" className="settings-more-btn settings-color-more" onClick={() => setShowAllColors((v) => !v)}>
              {showAllColors
                ? (text.appearance?.showLessColors || "Show less")
                : `+${Math.max(0, colorThemes.length - 10)} more`}
            </button>
          ) : null}
        </div>

        <label>{text.appearance?.fontSize || "Font size"}</label>
        <div className="settings-chip-list">
          {fontSizes.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`settings-chip ${fontSize === item.id ? "is-selected" : ""}`}
              onClick={() => onFontSize?.(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label>{text.appearance?.fontFamily || "Font family"}</label>
        <div className="settings-chip-list">
          {fontPresets.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`settings-chip ${fontPreset === item.id ? "is-selected" : ""}`}
              onClick={() => onFontPreset?.(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderSourcesTab() {
    const roots = indexStatus?.roots || [];
    return (
      <div className="settings-v2-section">
        <h2>{text.sources?.title || "Connected Folders"}</h2>
        <p>{text.sources?.hint || "Manage indexed folder sources and sync status."}</p>

        <div className="settings-v2-source-connect">
          <input
            className="settings-field"
            value={sourcePath}
            onChange={(e) => setSourcePath(e.target.value)}
            placeholder={text.sources?.pastePath || "Paste folder path"}
          />
          <button type="button" className="settings-chip" onClick={browseFolder} disabled={sourceBusy || !token}>
            {text.sources?.browse || "Browse"}
          </button>
          <button type="button" className="settings-save" onClick={connectFolder} disabled={sourceBusy || !token || !sourcePath.trim()}>
            {text.sources?.connectNow || "Connect now"}
          </button>
        </div>

        <div className="settings-v2-actions-row">
          <button type="button" className="settings-chip" onClick={resyncAllFolders} disabled={sourceBusy || !token || !roots.length}>
            {text.sources?.resyncAll || "Resync all"}
          </button>
        </div>

        <div className="settings-v2-list">
          {roots.length ? roots.map((root) => (
            <article key={root.root_path} className="settings-v2-list-item">
              <div className="settings-v2-list-head">
                <strong>{root.root_path}</strong>
                <span>{root.in_progress ? (text.sources?.indexing || "Indexing...") : (text.sources?.ready || "Ready")}</span>
              </div>
              <div className="settings-v2-list-meta">
                <span>{text.sources?.indexedFiles || "Indexed files"}: {root.indexed_files ?? 0}</span>
                <span>{text.sources?.lastIndexed || "Last indexed"}: {fmt(root.last_scan_at || root.created_at)}</span>
              </div>
              <div className="settings-v2-actions-row">
                <button type="button" className="settings-chip" onClick={() => resyncFolder(root.root_path)} disabled={sourceBusy || !token}>
                  {text.sources?.resync || "Resync"}
                </button>
                <button type="button" className="settings-chip danger" onClick={() => removeFolder(root.root_path)} disabled={sourceBusy || !token}>
                  {text.sources?.remove || "Remove"}
                </button>
              </div>
            </article>
          )) : <div className="settings-muted">{text.sources?.empty || "No connected folders yet."}</div>}
        </div>
      </div>
    );
  }

  function renderSearchTab() {
    return (
      <div className="settings-v2-section">
        <h2>{text.search?.title || "Search & Indexing"}</h2>
        <p>{text.search?.hint || "Control retrieval behavior and caching."}</p>

        <label>{text.search?.mode || "Search mode"}</label>
        <div className="settings-chip-list">
          {searchModes.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`settings-chip ${searchMode === item.id ? "is-selected" : ""}`}
              onClick={() => onSearchMode?.(item.id)}
              title={item.hint || ""}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label>{text.search?.fileTypes || "Included file types"}</label>
        <div className="settings-v2-checkbox-grid">
          {fileTypeOptions.map((item) => (
            <label key={item.id} className="settings-v2-check">
              <input
                type="checkbox"
                checked={Boolean(fileTypePrefs[item.id])}
                onChange={() => onToggleFileType?.(item.id)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>

        <label>{text.search?.cache || "Cache"}</label>
        <div className="settings-chip-list">
          {cacheModes.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`settings-chip ${cacheMode === item.id ? "is-selected" : ""}`}
              onClick={() => onCacheMode?.(item.id)}
              title={item.hint || ""}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderNotificationsTab() {
    return (
      <div className="settings-v2-section">
        <h2>{text.notifications?.title || "Notifications"}</h2>
        <p>{text.notifications?.hint || "Choose in-app alerts you want to see."}</p>

        <div className="settings-v2-checkbox-grid settings-v2-checkbox-grid-single">
          {notificationOptions.map((item) => (
            <label key={item.id} className="settings-v2-check">
              <input
                type="checkbox"
                checked={Boolean(notificationPrefs[item.id])}
                onChange={() => onToggleNotification?.(item.id)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  function renderSecurityTab() {
    return (
      <div className="settings-v2-section">
        <h2>{text.security?.title || "Security & Sessions"}</h2>
        <p>{text.security?.hint || "Password and session controls."}</p>

        <div className="settings-v2-stack">
          <section className="settings-v2-mini-card">
            <h3>{text.security?.changePassword || "Change password"}</h3>
            <form className="settings-v2-form-grid" onSubmit={submitChangePassword}>
              <div>
                <label>{text.security?.currentPassword || "Current password"}</label>
                <div className="settings-input">
                  <span className="settings-input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="4" y="11" width="16" height="10" rx="2" />
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    className="settings-field"
                    value={changePwd.current}
                    onChange={(e) => setChangePwd((prev) => ({ ...prev, current: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label>{text.security?.newPassword || "New password"}</label>
                <div className="settings-input">
                  <span className="settings-input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3v6" />
                      <path d="M9 6h6" />
                      <rect x="4" y="11" width="16" height="10" rx="2" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    className="settings-field"
                    value={changePwd.next}
                    onChange={(e) => setChangePwd((prev) => ({ ...prev, next: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label>{text.security?.confirmPassword || "Confirm password"}</label>
                <div className="settings-input">
                  <span className="settings-input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="4" y="11" width="16" height="10" rx="2" />
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                      <path d="m9.5 16 2 2 3-3" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    className="settings-field"
                    value={changePwd.confirm}
                    onChange={(e) => setChangePwd((prev) => ({ ...prev, confirm: e.target.value }))}
                  />
                </div>
              </div>
              {changePwdError ? <div className="settings-error">{changePwdError}</div> : null}
              <div className="settings-v2-actions-row">
                <button type="submit" className="settings-save" disabled={changePwdBusy || !token}>
                  {changePwdBusy ? (text.security?.savingPassword || "Saving...") : (text.security?.savePassword || "Update password")}
                </button>
              </div>
            </form>
          </section>

          <section className="settings-v2-mini-card">
            <h3>{text.security?.sessions || "Active sessions"}</h3>
            <div className="settings-v2-session-item">
              <div>
                <strong>{text.security?.currentDevice || "Current device"}</strong>
                <small>{navigator.userAgent}</small>
              </div>
              <span>{fmt(sessionStartedAt)}</span>
            </div>
            <div className="settings-v2-actions-row">
              <button type="button" className="settings-chip" onClick={onLogout}>
                {text.security?.logoutThis || "Logout this device"}
              </button>
              <button type="button" className="settings-chip danger" onClick={onLogout}>
                {text.security?.logoutAll || "Logout all devices"}
              </button>
            </div>
          </section>
        </div>

        <label>{text.security?.autoLock || "Auto-lock"}</label>
        <div className="settings-chip-list">
          {autoLockOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`settings-chip ${autoLock === item.id ? "is-selected" : ""}`}
              onClick={() => onAutoLock?.(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderDataTab() {
    return (
      <div className="settings-v2-section">
        <h2>{text.data?.title || "Data Control"}</h2>
        <p>{text.data?.hint || "Export, clean, and manage chat data."}</p>

        <div className="settings-v2-actions-row settings-v2-wrap">
          <button type="button" className="settings-chip" onClick={exportChats} disabled={dataBusy || !token}>
            {text.data?.exportChats || "Export chats (JSON)"}
          </button>
          <button type="button" className="settings-chip" onClick={clearSearchHistory} disabled={dataBusy}>
            {text.data?.clearHistory || "Clear search history"}
          </button>
          <button type="button" className="settings-chip danger" onClick={deleteAllChats} disabled={dataBusy || !token}>
            {text.data?.deleteAllChats || "Delete all chats"}
          </button>
          <button type="button" className="settings-chip" onClick={clearCache} disabled={dataBusy}>
            {text.data?.clearCache || "Clear cache"}
          </button>
        </div>

        <h3>{text.data?.archivedList || "Archived chats list"}</h3>
        <div className="settings-v2-list">
          {archivedChats.length ? archivedChats.map((cid) => (
            <article key={cid} className="settings-v2-list-item">
              <div className="settings-v2-list-head">
                <strong>{cid}</strong>
              </div>
              <div className="settings-v2-actions-row">
                <button type="button" className="settings-chip" onClick={() => unarchiveConversation(cid)}>
                  {text.data?.unarchive || "Unarchive"}
                </button>
              </div>
            </article>
          )) : <div className="settings-muted">{text.data?.noArchived || "No archived chats."}</div>}
        </div>
      </div>
    );
  }

  function renderTabBody() {
    switch (activeTab) {
      case "profile":
        return renderProfileTab();
      case "appearance":
        return renderAppearanceTab();
      case "sources":
        return renderSourcesTab();
      case "search":
        return renderSearchTab();
      case "notifications":
        return renderNotificationsTab();
      case "security":
        return renderSecurityTab();
      case "data":
        return renderDataTab();
      default:
        return renderProfileTab();
    }
  }

  return (
    <div className="settings-v2-wrap settings-v2-animate">
      <aside className="settings-v2-nav">
        <nav className="settings-v2-tab-list" aria-label="Settings tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`settings-v2-tab ${activeTab === tab.id ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="settings-v2-panel">
        {loading ? <div className="settings-muted">{common.loading || "Loading..."}</div> : renderTabBody()}
        {status ? <div className="settings-status">{status}</div> : null}
      </section>
    </div>
  );
}
