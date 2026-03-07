import React from "react";

export default function ThemeToggle({ theme, onToggle, className = "" }) {
  const isLight = theme === "light";
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={onToggle}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      title={isLight ? "Switch to dark theme" : "Switch to light theme"}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        ◐
      </span>
    </button>
  );
}
