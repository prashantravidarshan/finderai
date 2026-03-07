import React from "react";
import { clsx } from "../../utils/format.js";

export default function Select({ className="", children, ...props }) {
  return (
    <span className="ui-select-wrap">
      <select
        className={clsx(
          "ui-select w-full rounded-xl px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 ui-input",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <span className="ui-select-caret" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </span>
  );
}
