import React, { useEffect, useState } from "react";
import Button from "./ui/Button.jsx";
import { apiJson } from "../api/client.js";
import { APP_MESSAGES } from "../config/appConfig.js";

function fmt(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  return d.toLocaleString(undefined, { month:"short", day:"2-digit", hour:"2-digit", minute:"2-digit" });
}

export default function RunHistory({ token, conversationId, copy }) {
  const text = copy?.workspace?.drawers || APP_MESSAGES.en.workspace.drawers;
  const [open, setOpen] = useState(false);
  const [runs, setRuns] = useState([]);
  const [err, setErr] = useState("");

  async function load() {
    if (!token || !conversationId) return;
    setErr("");
    try {
      const data = await apiJson(`/api/logs/${conversationId}?limit=25`, { token });
      setRuns(data.runs || []);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    if (open) load();
  }, [open, conversationId]);

  if (!conversationId) return null;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold">{text.runLogs || "Run logs"}</div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setOpen(v => !v)}>{open ? (text.hide || "Hide") : (text.show || "Show")}</Button>
          {open ? <Button variant="secondary" onClick={load}>{text.refresh || "Refresh"}</Button> : null}
        </div>
      </div>

      {open ? (
        <div className="mt-2 space-y-2">
          {err ? <div className="text-xs text-red-400">{err}</div> : null}
          {runs.length ? runs.map(r => (
            <details key={r.id} className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-overlay)] p-3">
              <summary className="cursor-pointer text-xs text-[var(--text-secondary)]">
                #{r.id} · {fmt(r.created_at)} · {r.request?.message || "—"} · {r.latency_ms != null ? `${r.latency_ms}ms` : "—"}
              </summary>
              <pre className="mt-2 max-h-72 overflow-auto text-[11px] text-[var(--text-secondary)]">{JSON.stringify(r, null, 2)}</pre>
            </details>
          )) : <div className="text-xs text-[var(--text-muted)]">{text.noRuns || "No runs yet."}</div>}
        </div>
      ) : null}
    </div>
  );
}
