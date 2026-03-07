import React, { useEffect, useMemo, useState } from "react";
import {
  APP_COLOR_THEMES,
  APP_FONT_SIZES,
  APP_FONT_PRESETS,
  APP_LOCALES,
  APP_MESSAGES,
  APP_PUBLIC_MENU_GROUPS,
  APP_THEME_MODES,
} from "../../config/appConfig.js";

export default function PublicLayout({
  onGoHome,
  onGoLogin,
  onGoDashboard,
  token,
  children,
  copy,
  menuGroups,
  themeMode = "system",
  onThemeMode,
  colorTheme = "default",
  onColorTheme,
  fontPreset = "default",
  onFontPreset,
  fontSize = "default",
  onFontSize,
  locale = "en",
  onLocale,
  locales = APP_LOCALES,
  themeModes = APP_THEME_MODES,
  colorThemes = APP_COLOR_THEMES,
  fontPresets = APP_FONT_PRESETS,
  fontSizes = APP_FONT_SIZES,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("appearance");
  const [langQuery, setLangQuery] = useState("");
  const [showAllColors, setShowAllColors] = useState(false);
  const text = copy?.public || APP_MESSAGES.en.public;
  const activeMenuGroups = menuGroups || text.menuGroups || APP_PUBLIC_MENU_GROUPS;

  const filteredLocales = useMemo(() => {
    const q = langQuery.trim().toLowerCase();
    if (!q) return locales;
    return locales.filter((item) => {
      return (
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.native.toLowerCase().includes(q)
      );
    });
  }, [langQuery, locales]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    if (menuOpen || settingsOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen, settingsOpen]);

  useEffect(() => {
    if (!menuOpen && !settingsOpen) return undefined;
    const onEsc = (event) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      setSettingsOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [menuOpen, settingsOpen]);

  const settingsTabs = [
    { id: "appearance", label: text.appearanceTab || "Appearance" },
    { id: "language", label: text.languageTab || "Language" },
  ];

  return (
    <div className="public-root">
      <div className="public-grid" />
      <div className="public-shell">
        <header className="public-topbar">
          <button className="brand-button" onClick={onGoHome}>
            <span className="brand-mark">FQ</span>
            <span className="brand-text">
              <strong>Fyndoy</strong>
              <small>SMART FINDER</small>
            </span>
          </button>

          <div className="public-actions">
            <button className="public-btn public-btn-primary" onClick={token ? onGoDashboard : onGoLogin}>
              {token ? (text.dashboardLabel || "Dashboard") : (text.loginLabel || "Login")}
            </button>

            <button
              type="button"
              className={`public-settings-btn ${settingsOpen ? "is-open" : ""}`}
              aria-label={text.settingsTitle || "Settings"}
              title={text.settingsTitle || "Settings"}
              onClick={() => {
                setSettingsOpen((v) => !v);
                setMenuOpen(false);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9.5A2.5 2.5 0 1 0 12 14.5 2.5 2.5 0 1 0 12 9.5Z" />
                <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1 1 0 0 1 0 1.4l-1.2 1.2a1 1 0 0 1-1.4 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1 1 0 0 1-1 1h-1.7a1 1 0 0 1-1-1v-.1a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1 1 0 0 1-1.4 0L4.3 17.8a1 1 0 0 1 0-1.4l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H3.6a1 1 0 0 1-1-1v-1.7a1 1 0 0 1 1-1h.1a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1 1 0 0 1 0-1.4l1.2-1.2a1 1 0 0 1 1.4 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a1 1 0 0 1 1-1h1.7a1 1 0 0 1 1 1v.1a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1 1 0 0 1 1.4 0l1.2 1.2a1 1 0 0 1 0 1.4l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.1a1 1 0 0 1 1 1v1.7a1 1 0 0 1-1 1h-.1a1 1 0 0 0-.9.6Z" />
              </svg>
            </button>

            <button
              type="button"
              className={`public-menu-btn ${menuOpen ? "is-open" : ""}`}
              aria-label={menuOpen ? (text.menuAriaClose || "Close menu") : (text.menuAriaOpen || "Open menu")}
              onClick={() => {
                setMenuOpen((v) => !v);
                setSettingsOpen(false);
              }}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </header>

        {children}
      </div>

      <div className={`public-menu-overlay ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="public-menu-head">
          <button className="public-menu-brand brand-button" onClick={onGoHome}>
            <span className="brand-mark">FQ</span>
            <span className="brand-text">
              <strong>Fyndoy</strong>
              <small>SMART FINDER</small>
            </span>
          </button>
          <button className="public-menu-close" onClick={() => setMenuOpen(false)} aria-label={text.close || "Close"}>
            {text.close || "Close"}
          </button>
        </div>

        <div className="public-menu-links">
          {activeMenuGroups.map((group) => (
            <section key={group.title} className="public-menu-group">
              <h2>{group.title}</h2>
              {group.links.map((link) => (
                <button key={link} type="button" className="public-menu-link" onClick={() => setMenuOpen(false)}>
                  {link}
                </button>
              ))}
            </section>
          ))}
        </div>

        <div className="public-menu-note" />
      </div>

      <div className={`public-settings-overlay ${settingsOpen ? "is-open" : ""}`} aria-hidden={!settingsOpen}>
        <div className="public-menu-head">
          <button className="public-menu-brand brand-button" onClick={onGoHome}>
            <span className="brand-mark">FQ</span>
            <span className="brand-text">
              <strong>Fyndoy</strong>
              <small>SMART FINDER</small>
            </span>
          </button>
          <button className="public-menu-close" onClick={() => setSettingsOpen(false)} aria-label={text.close || "Close"}>
            {text.close || "Close"}
          </button>
        </div>

        <div className="settings-v2-wrap public-settings-v2-wrap">
          <aside className="settings-v2-nav public-settings-v2-nav">
            <nav className="settings-v2-tab-list" aria-label={text.settingsTitle || "Settings"}>
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`settings-v2-tab ${settingsTab === tab.id ? "is-active" : ""}`}
                  onClick={() => setSettingsTab(tab.id)}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          <section className="settings-v2-panel public-settings-v2-panel">
            {settingsTab === "appearance" ? (
              <div className="settings-v2-section">
                <h2>{text.appearanceTab || "Appearance"}</h2>
                <p>{text.settingsHint || "Control theme, color, and typography."}</p>

                <label>{text.themeTitle || "Theme"}</label>
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

                <label>{text.colorTitle || "Color Theme"}</label>
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
                        ? (copy?.settings?.appearance?.showLessColors || "Show less")
                        : `+${Math.max(0, colorThemes.length - 10)} more`}
                    </button>
                  ) : null}
                </div>

                <label>{text.fontTitle || "Font Family"}</label>
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

                <label>{text.fontSizeTitle || "Font Size"}</label>
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
              </div>
            ) : (
              <div className="settings-v2-section">
                <h2>{text.languageTab || "Language"}</h2>
                <p>{text.languageTitle || "Language"}</p>
                <input
                  className="public-settings-search"
                  placeholder={text.searchLanguage || "Search language"}
                  value={langQuery}
                  onChange={(event) => setLangQuery(event.target.value)}
                />
                <div className="public-settings-language-list">
                  {filteredLocales.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      className={`public-settings-language-item ${locale === item.code ? "is-selected" : ""}`}
                      onClick={() => onLocale?.(item.code)}
                    >
                      <span className="public-settings-flag" aria-hidden="true">{item.flag}</span>
                      <span className="public-settings-language-meta">
                        <strong>{item.name}</strong>
                        <small>{item.native} · /{item.code}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
