import React from "react";

export default function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 overlay-backdrop" onClick={onClose} />
      <div className="relative w-[92vw] max-w-xl rounded-3xl modal-panel">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] p-4">
          <div className="text-sm font-bold">{title}</div>
          <button className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
