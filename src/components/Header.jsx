import React from "react";
import Button from "./ui/Button.jsx";

export default function Header({
  onGoSettings,
  onGoDashboard,
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] font-black text-xs tracking-wider text-[var(--text-primary)]">
          FQ
        </div>
        <div>
          <div className="text-base font-black tracking-tight">Fyndoy</div>
          <div className="text-xs text-[var(--text-muted)]">Smart Finder Workspace</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {onGoDashboard ? <Button variant="secondary" className="hidden sm:inline-flex" onClick={onGoDashboard}>Dashboard</Button> : null}
        {onGoSettings ? <Button variant="secondary" className="hidden sm:inline-flex" onClick={onGoSettings}>Settings</Button> : null}
      </div>
    </div>
  );
}
