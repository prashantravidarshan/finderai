import React from "react";
import { clsx } from "../../utils/format.js";
import Button from "../ui/Button.jsx";

export default function Drawer({ open, title, onClose, children }) {
  return (
    <div className={clsx("fixed inset-0 z-50", open ? "" : "pointer-events-none")}>
      <div
        className={clsx(
          "absolute inset-0 overlay-backdrop transition",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <div
        className={clsx(
          "absolute right-0 top-0 h-full w-full sm:w-[520px] drawer-panel transition-transform",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="text-sm font-bold">{title}</div>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
        <div className="p-4 overflow-auto h-[calc(100%-64px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
