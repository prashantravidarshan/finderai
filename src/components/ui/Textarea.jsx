import React from "react";
import { clsx } from "../../utils/format.js";

export default function Textarea({ className="", ...props }) {
  return (
    <textarea
      className={clsx(
        "w-full rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 ui-input",
        className
      )}
      {...props}
    />
  );
}
