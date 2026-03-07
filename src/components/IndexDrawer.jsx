import React, { useEffect, useState } from "react";
import Button from "./ui/Button.jsx";
import { apiJson } from "../api/client.js";
import { APP_MESSAGES } from "../config/appConfig.js";

function fmt(ts) {
  if (!ts) return "—";
  const s = String(ts).trim();
  const n = Number(s);
  const d = Number.isFinite(n) && /^[0-9]+$/.test(s)
    ? new Date(s.length <= 10 ? n * 1000 : n)
    : new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  return d.toLocaleString(undefined, { month:"short", day:"2-digit", hour:"2-digit", minute:"2-digit" });
}

export default function IndexDrawer({ token, onConnect, copy }) {
  const text = copy?.workspace?.drawers || APP_MESSAGES.en.workspace.drawers;
  const [status, setStatus] = useState(null);
  const [events, setEvents] = useState([]);
  const [err, setErr] = useState("");

  async function refresh() {
    if (!token) return;
    setErr("");
    try {
      const s = await apiJson("/api/index/status", { token });
      setStatus(s);
      const e = await apiJson("/api/index/events?limit=60", { token });
      setEvents(e.events || []);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => { refresh(); }, [token]);

  async function resync(rootPath) {
    setErr("");
    try {
      await apiJson("/api/index/resync", { method:"POST", token, body: { root_path: rootPath } });
      await refresh();
    } catch (e) {
      setErr(e.message);
    }
  }

  const roots = status?.roots || [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold">{text.index || "Index"}</div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={refresh}>{text.refresh || "Refresh"}</Button>
          <Button onClick={onConnect}>{text.connect || "Connect"}</Button>
        </div>
      </div>

      {err ? <div className="mt-2 text-xs text-red-400">{err}</div> : null}

      <div className="mt-3 space-y-2">
        {roots.length ? roots.map(r => (
          <div key={r.root_path} className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-elev)] p-3">
            <div className="text-xs font-mono text-[var(--text-secondary)] break-all">{r.root_path}</div>
            <div className="mt-1 text-[11px] text-[var(--text-muted)]">
              {r.in_progress ? (text.indexRunning || "indexing...") : (text.indexReady || "ready")} ·
              {" "}{text.filesScanned || "files scanned"} {r.indexed_files || 0} ·
              {" "}{text.lastScan || "last scan"} {fmt(r.last_scan_at)} ·
              {" "}{text.queued || "queued"} {r.queued_events || 0}
            </div>
            {r.last_error ? <div className="mt-1 text-[11px] text-red-400">{text.error || "Error"}: {r.last_error}</div> : null}
            <div className="mt-2">
              <Button variant="secondary" onClick={() => resync(r.root_path)}>{text.resync || "Resync"}</Button>
            </div>
          </div>
        )) : <div className="text-xs text-[var(--text-muted)]">{text.noFolders || "No folders connected."}</div>}
      </div>

      <div className="mt-4 text-xs font-bold">{text.indexEvents || "Index events"}</div>
      <div className="mt-2 max-h-64 overflow-auto rounded-2xl border border-[var(--border-color)] bg-[var(--surface-overlay)] p-3 space-y-2">
        {events.length ? events.map(ev => (
          <div key={ev.id} className="text-[11px] text-[var(--text-secondary)]">
            <span className="text-[var(--text-muted)]">#{ev.id}</span>{" "}
            <span className="text-[var(--text-muted)]">{ev.created_at}</span>{" "}
            <span className="font-mono">{ev.action}</span>{" "}
            <span className="text-[var(--text-muted)]">{ev.source_path || "—"}</span>
          </div>
        )) : <div className="text-[11px] text-[var(--text-muted)]">{text.noEvents || "No events yet."}</div>}
      </div>
    </div>
  );
}
