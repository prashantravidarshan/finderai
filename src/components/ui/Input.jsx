import React from "react";
import { clsx } from "../../utils/format.js";

export default function Input({ className="", ...props }) {
  return (
    <input
      className={clsx(
        "w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 ui-input",
        className
      )}
      {...props}
    />
  );
}
