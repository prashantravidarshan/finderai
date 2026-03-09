import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiJson } from "../../api/client.js";
import { APP_MESSAGES } from "../../config/appConfig.js";
import { useFilePreview } from "../../hooks/useFilePreview.js";

function formatDate(ts) {
  if (!ts) return "-";
  const raw = typeof ts === "string" ? ts.trim() : String(ts);
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const withZone = /Z$|[+-]\d\d:\d\d$/.test(normalized) ? normalized : `${normalized}Z`;
  const d = new Date(withZone);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatBytes(bytes) {
  const size = Number(bytes || 0);
  if (!Number.isFinite(size) || size <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const p = Math.min(units.length - 1, Math.floor(Math.log(size) / Math.log(1024)));
  const n = size / (1024 ** p);
  return `${n >= 10 ? n.toFixed(0) : n.toFixed(1)} ${units[p]}`;
}

function normalizePath(v = "") {
  return String(v || "").replace(/\\\\/g, "/").replace(/^\/+/, "").replace(/\/+/g, "/");
}

function dirOf(path = "") {
  const clean = normalizePath(path);
  const idx = clean.lastIndexOf("/");
  return idx <= 0 ? "" : clean.slice(0, idx);
}

function basename(path = "") {
  const clean = normalizePath(path);
  const idx = clean.lastIndexOf("/");
  return idx === -1 ? clean : clean.slice(idx + 1);
}

function fileTypeLabel(file) {
  const name = (file?.filename || "").toLowerCase();
  const mime = (file?.mime || "").toLowerCase();
  if (mime.includes("pdf") || name.endsWith(".pdf")) return "PDF";
  if (mime.startsWith("image/") || /\.(png|jpg|jpeg|webp|heic|bmp|gif|tiff)$/i.test(name)) return "Image";
  if (mime.includes("word") || name.endsWith(".docx") || name.endsWith(".doc")) return "Document";
  if (mime.includes("sheet") || name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) return "Sheet";
  if (mime.startsWith("text/") || /\.(txt|md|json|log)$/i.test(name)) return "Text";
  return "File";
}

function extensionOf(name = "") {
  const idx = name.lastIndexOf(".");
  if (idx <= 0) return "";
  return name.slice(idx + 1).toLowerCase();
}

function fileIcon(type) {
  if (type === "PDF") return "pdf";
  if (type === "Image") return "image";
  if (type === "Sheet") return "sheet";
  if (type === "Document") return "doc";
  if (type === "Text") return "text";
  return "file";
}

function fileThumb(file) {
  return file?.thumbnail_url || file?.thumb_url || file?.preview_url || "";
}

function sortFiles(list, mode) {
  const rows = [...(list || [])];
  switch (mode) {
    case "name_asc":
      return rows.sort((a, b) => (a.filename || "").localeCompare(b.filename || ""));
    case "name_desc":
      return rows.sort((a, b) => (b.filename || "").localeCompare(a.filename || ""));
    case "size_desc":
      return rows.sort((a, b) => Number(b.size_bytes || 0) - Number(a.size_bytes || 0));
    case "size_asc":
      return rows.sort((a, b) => Number(a.size_bytes || 0) - Number(b.size_bytes || 0));
    case "type_asc":
      return rows.sort((a, b) => fileTypeLabel(a).localeCompare(fileTypeLabel(b)));
    case "type_desc":
      return rows.sort((a, b) => fileTypeLabel(b).localeCompare(fileTypeLabel(a)));
    case "path_asc":
      return rows.sort((a, b) => String(a.relpath || a.filename || "").localeCompare(String(b.relpath || b.filename || "")));
    case "path_desc":
      return rows.sort((a, b) => String(b.relpath || b.filename || "").localeCompare(String(a.relpath || a.filename || "")));
    case "date_asc":
      return rows.sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
    case "date_desc":
    default:
      return rows.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  }
}

export default function IndexFilesPage({
  token,
  copy,
  files = [],
  defaultTab = "files",
  onRefreshFiles,
}) {
  const text = copy?.workspace?.drawers || APP_MESSAGES.en.workspace.drawers;
  const [activeTab, setActiveTab] = useState(defaultTab === "indexing" ? "indexing" : "files");
  const [status, setStatus] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sourceBusy, setSourceBusy] = useState(false);
  const [sourcePath, setSourcePath] = useState("");
  const [search, setSearch] = useState("");
  const [ext, setExt] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [viewMode, setViewMode] = useState("icons");
  const [iconSize, setIconSize] = useState("md");
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [activePath, setActivePath] = useState("");
  const [columns, setColumns] = useState({
    name: true,
    type: true,
    size: true,
    modified: true,
    created: true,
    path: true,
  });
  const [colWidths, setColWidths] = useState({
    name: 340,
    type: 120,
    size: 120,
    modified: 170,
    created: 170,
    path: 260,
  });
  const [err, setErr] = useState("");
  const [syncTick, setSyncTick] = useState(0);

  const viewWrapRef = useRef(null);

  useEffect(() => {
    setActiveTab(defaultTab === "indexing" ? "indexing" : "files");
  }, [defaultTab]);

  useEffect(() => {
    function onDocDown(event) {
      if (!showViewMenu) return;
      if (viewWrapRef.current?.contains(event.target)) return;
      setShowViewMenu(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [showViewMenu]);

  function startColumnResize(col, e) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = Number(colWidths[col] || 160);
    function onMove(ev) {
      const dx = ev.clientX - startX;
      setColWidths((prev) => ({ ...prev, [col]: Math.max(90, startW + dx) }));
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  async function refreshIndex() {
    if (!token) return;
    setErr("");
    setLoading(true);
    try {
      const [s, e] = await Promise.all([
        apiJson("/api/index/status", { token }),
        apiJson("/api/index/events?limit=80", { token }),
      ]);
      setStatus(s || { roots: [] });
      setEvents(e.events || []);
    } catch (e) {
      setErr(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshIndex();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (activeTab !== "indexing") return undefined;
    const anyInProgress = (status?.roots || []).some((root) => root.in_progress);
    if (!anyInProgress && !sourceBusy) return undefined;
    const timer = window.setInterval(async () => {
      await refreshIndex();
      onRefreshFiles?.();
      setSyncTick((v) => (v + 1) % 10000);
    }, 3500);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, status, sourceBusy]);

  async function browseFolder() {
    if (!token) return;
    try {
      setSourceBusy(true);
      const data = await apiJson("/api/index/browse", { method: "POST", token, body: {} });
      if (data?.root_path) setSourcePath(data.root_path);
    } catch (e) {
      const msg = String(e.message || "");
      if (!/cancel|user cancelled|folder selection cancelled|-\d+/.test(msg.toLowerCase())) {
        setErr(msg || "Request failed");
      }
    } finally {
      setSourceBusy(false);
    }
  }

  async function connectFolder() {
    if (!token || !sourcePath.trim()) return;
    try {
      setSourceBusy(true);
      setErr("");
      await apiJson("/api/index/connect", { method: "POST", token, body: { root_path: sourcePath.trim() } });
      setSourcePath("");
      await refreshIndex();
      onRefreshFiles?.();
    } catch (e) {
      setErr(e.message || "Request failed");
    } finally {
      setSourceBusy(false);
    }
  }

  async function resyncFolder(rootPath) {
    if (!token || !rootPath) return;
    try {
      setSourceBusy(true);
      setErr("");
      await apiJson("/api/index/resync", { method: "POST", token, body: { root_path: rootPath } });
      await refreshIndex();
      onRefreshFiles?.();
    } catch (e) {
      setErr(e.message || "Request failed");
    } finally {
      setSourceBusy(false);
    }
  }

  async function removeFolder(rootPath) {
    if (!token || !rootPath) return;
    try {
      setSourceBusy(true);
      setErr("");
      await apiJson("/api/index/remove", { method: "POST", token, body: { root_path: rootPath } });
      await refreshIndex();
      onRefreshFiles?.();
    } catch (e) {
      setErr(e.message || "Request failed");
    } finally {
      setSourceBusy(false);
    }
  }

  async function resyncAll() {
    const roots = status?.roots || [];
    if (!token || !roots.length) return;
    try {
      setSourceBusy(true);
      setErr("");
      await Promise.all(roots.map((root) => apiJson("/api/index/resync", {
        method: "POST",
        token,
        body: { root_path: root.root_path },
      })));
      await refreshIndex();
      onRefreshFiles?.();
    } catch (e) {
      setErr(e.message || "Request failed");
    } finally {
      setSourceBusy(false);
    }
  }

  const extensions = useMemo(() => {
    const set = new Set();
    for (const file of files || []) {
      const extName = extensionOf(file?.filename || "");
      if (extName) set.add(extName);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [files]);

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = files || [];
    if (q) {
      rows = rows.filter((file) => {
        const rel = normalizePath(file.relpath || file.filename || "");
        const type = fileTypeLabel(file).toLowerCase();
        return rel.toLowerCase().includes(q) || type.includes(q);
      });
    }
    if (ext !== "all") {
      rows = rows.filter((file) => extensionOf(file.filename || "") === ext);
    }
    return sortFiles(rows, sortBy);
  }, [files, search, ext, sortBy]);

  const scopedData = useMemo(() => {
    const base = activePath ? `${activePath}/` : "";
    const folderMap = new Map();
    const directFiles = [];

    for (const file of filteredFiles) {
      const rel = normalizePath(file.relpath || file.filename || "");
      if (!rel) continue;
      if (base && !rel.startsWith(base)) continue;
      const rest = base ? rel.slice(base.length) : rel;
      if (!rest) continue;
      const slash = rest.indexOf("/");
      if (slash === -1) {
        directFiles.push(file);
      } else {
        const child = rest.slice(0, slash);
        const childPath = activePath ? `${activePath}/${child}` : child;
        if (!folderMap.has(childPath)) {
          folderMap.set(childPath, {
            kind: "folder",
            id: `folder:${childPath}`,
            name: child,
            path: childPath,
          });
        }
      }
    }

    const folders = Array.from(folderMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    return {
      folders,
      files: directFiles,
      items: [...folders, ...directFiles.map((f) => ({ kind: "file", id: f.id, file: f }))],
    };
  }, [filteredFiles, activePath]);

  useEffect(() => {
    const visibleFileIds = new Set(scopedData.files.map((f) => f.id));
    if (selectedFileId && visibleFileIds.has(selectedFileId)) return;
    setSelectedFileId(scopedData.files[0]?.id || null);
  }, [scopedData, selectedFileId]);

  const selectedFile = scopedData.files.find((f) => f.id === selectedFileId) || scopedData.files[0] || null;
  const roots = status?.roots || [];
  const indexingLive = roots.some((root) => root.in_progress);

  const selectedMime = selectedFile?.mime || "";
  const { url: selectedPreviewUrl, loading: selectedPreviewLoading } = useFilePreview({
    token,
    fileId: selectedFile?.id || null,
    mime: selectedMime,
  });

  function onSortColumn(column) {
    setSortBy((prev) => {
      if (column === "name") return prev === "name_asc" ? "name_desc" : "name_asc";
      if (column === "modified" || column === "created") return prev === "date_desc" ? "date_asc" : "date_desc";
      if (column === "size") return prev === "size_desc" ? "size_asc" : "size_desc";
      if (column === "type") return prev === "type_asc" ? "type_desc" : "type_asc";
      if (column === "path") return prev === "path_asc" ? "path_desc" : "path_asc";
      return prev;
    });
  }

  function sortMarker(column) {
    const map = {
      name_asc: { col: "name", icon: "↑" },
      name_desc: { col: "name", icon: "↓" },
      date_desc: { col: "modified", icon: "↓" },
      date_asc: { col: "modified", icon: "↑" },
      size_desc: { col: "size", icon: "↓" },
      size_asc: { col: "size", icon: "↑" },
      type_asc: { col: "type", icon: "↑" },
      type_desc: { col: "type", icon: "↓" },
      path_asc: { col: "path", icon: "↑" },
      path_desc: { col: "path", icon: "↓" },
    };
    const current = map[sortBy];
    if (!current) return "";
    if (column === "created" && current.col === "modified") return current.icon;
    return current.col === column ? current.icon : "";
  }

  function renderThumb(file, size = "sm") {
    const type = fileTypeLabel(file);
    const iconId = fileIcon(type);
    const extLabel = extensionOf(file.filename || "").toUpperCase() || type.toUpperCase();
    const thumb = fileThumb(file);
    const cls = size === "lg" ? "assets-thumb assets-thumb-lg" : size === "md" ? "assets-thumb assets-thumb-md" : "assets-thumb assets-thumb-sm";
    const isImage = type === "Image";
    if (thumb && isImage) return <span className={cls}><img src={thumb} alt={type} loading="lazy" /></span>;
    return (
      <span className={cls}>
        <span className={`assets-glyph assets-glyph-${iconId}`} aria-hidden="true">{extLabel.slice(0, 4)}</span>
      </span>
    );
  }

  function folderPath(file) {
    const rel = normalizePath(file.relpath || file.filename || "");
    const d = dirOf(rel);
    return d || "/";
  }

  function openFolder(path) {
    setActivePath(path);
  }

  const crumbs = useMemo(() => {
    if (!activePath) return [];
    const parts = activePath.split("/").filter(Boolean);
    const out = [];
    let p = "";
    for (const part of parts) {
      p = p ? `${p}/${part}` : part;
      out.push({ name: part, path: p });
    }
    return out;
  }, [activePath]);

  return (
    <div className="assets-page">
      <header className="assets-page-head">
        <div className="assets-head-left">
          <div className="assets-brand">
            <span className="assets-brand-mark">FQ</span>
            <span className="assets-brand-text">
              <strong>Fyndoy</strong>
              <small>SMART FINDER</small>
            </span>
          </div>
          <div className="assets-page-tabs">
            <button type="button" className={activeTab === "indexing" ? "assets-tab is-active" : "assets-tab"} onClick={() => setActiveTab("indexing")}>{copy?.settings?.sources?.title || "Connected Folders"}</button>
            <button type="button" className={activeTab === "files" ? "assets-tab is-active" : "assets-tab"} onClick={() => setActiveTab("files")}>{text.files || "Files"}</button>
          </div>
        </div>
        <button type="button" className="settings-chip" onClick={() => { refreshIndex(); onRefreshFiles?.(); }}>{text.refresh || "Refresh"}</button>
      </header>

      {err ? <div className="settings-error">{err}</div> : null}
      {indexingLive ? (
        <div className="assets-live-sync" key={`sync-${syncTick}`}>
          <span className="assets-live-dot" />
          <span>{copy?.settings?.sources?.indexing || "Syncing folders and files in real time..."}</span>
        </div>
      ) : null}

      {activeTab === "indexing" ? (
        <section className="assets-indexing-wrap">
          <div className="settings-v2-source-connect">
            <input className="settings-field" value={sourcePath} onChange={(e) => setSourcePath(e.target.value)} placeholder={copy?.settings?.sources?.pastePath || "Paste folder path"} />
            <button type="button" className="settings-chip" onClick={browseFolder} disabled={sourceBusy || !token}>{copy?.settings?.sources?.browse || "Browse"}</button>
            <button type="button" className="settings-save" onClick={connectFolder} disabled={sourceBusy || !token || !sourcePath.trim()}>{copy?.settings?.sources?.connectNow || "Connect now"}</button>
          </div>

          <div className="settings-v2-actions-row">
            <button type="button" className="settings-chip" onClick={resyncAll} disabled={sourceBusy || !roots.length}>{copy?.settings?.sources?.resyncAll || "Resync all"}</button>
            <span className="settings-muted">{loading ? (copy?.settings?.common?.loading || "Loading...") : ""}</span>
          </div>

          <div className="settings-v2-list">
            {roots.length ? roots.map((root) => (
              <article key={root.root_path} className="settings-v2-list-item">
                <div className="settings-v2-list-head">
                  <strong>{root.root_path}</strong>
                  <span>{root.in_progress ? (copy?.settings?.sources?.indexing || "Indexing...") : (copy?.settings?.sources?.ready || "Ready")}</span>
                </div>
                {root.in_progress ? <div className="assets-sync-progress" aria-hidden="true"><span /></div> : null}
                <div className="settings-v2-list-meta">
                  <span>{copy?.settings?.sources?.indexedFiles || "Indexed files"}: {root.indexed_files ?? 0}</span>
                  <span>{copy?.settings?.sources?.lastIndexed || "Last indexed"}: {formatDate(root.last_scan_at || root.created_at)}</span>
                </div>
                <div className="settings-v2-actions-row">
                  <button type="button" className="settings-chip" onClick={() => resyncFolder(root.root_path)} disabled={sourceBusy}>{copy?.settings?.sources?.resync || "Resync"}</button>
                  <button type="button" className="settings-chip danger" onClick={() => removeFolder(root.root_path)} disabled={sourceBusy}>{copy?.settings?.sources?.remove || "Remove"}</button>
                </div>
              </article>
            )) : (
              <div className="settings-muted">{copy?.settings?.sources?.empty || text.noFolders || "No folders connected."}</div>
            )}
          </div>

          <div className="assets-events">
            <h3>{text.indexEvents || "Index events"}</h3>
            <div className="assets-events-list">
              {events.length ? events.map((event) => (
                <div key={event.id} className="assets-event-row">
                  <span className="assets-event-id">#{event.id}</span>
                  <span className="assets-event-action">{event.event_type || event.action || "-"}</span>
                  <span className="assets-event-path">{event.file_path || event.source_path || "-"}</span>
                  <span className="assets-event-time">{formatDate(event.created_at)}</span>
                </div>
              )) : (
                <div className="settings-muted">{text.noEvents || "No events yet."}</div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="assets-files-wrap">
          <div className="assets-files-toolbar">
            <div className="workspace-chat-search assets-files-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input className="workspace-chat-search-input" placeholder={copy?.settings?.common?.search || "Search"} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="assets-select-wrap">
              <select className="settings-field assets-select" value={ext} onChange={(e) => setExt(e.target.value)}>
                <option value="all">All extensions</option>
                {extensions.map((extName) => (<option key={extName} value={extName}>.{extName}</option>))}
              </select>
              <span className="assets-select-caret" aria-hidden="true">▾</span>
            </div>

            <div className="assets-select-wrap">
              <select className="settings-field assets-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="date_desc">Date: Newest</option>
                <option value="date_asc">Date: Oldest</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
                <option value="size_desc">Size: Large to small</option>
                <option value="size_asc">Size: Small to large</option>
                <option value="type_asc">Type: A to Z</option>
                <option value="type_desc">Type: Z to A</option>
                <option value="path_asc">Path: A to Z</option>
                <option value="path_desc">Path: Z to A</option>
              </select>
              <span className="assets-select-caret" aria-hidden="true">▾</span>
            </div>

            <div className="assets-view-toggle">
              <button type="button" className={viewMode === "icons" ? "assets-view-btn is-active" : "assets-view-btn"} title="Icons" onClick={() => setViewMode("icons")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="8" height="8" /><rect x="13" y="3" width="8" height="8" /><rect x="3" y="13" width="8" height="8" /><rect x="13" y="13" width="8" height="8" /></svg>
              </button>
              <button type="button" className={viewMode === "list" ? "assets-view-btn is-active" : "assets-view-btn"} title="List" onClick={() => setViewMode("list")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></svg>
              </button>
              <button type="button" className={viewMode === "details" ? "assets-view-btn is-active" : "assets-view-btn"} title="List + details" onClick={() => setViewMode("details")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h12" /></svg>
              </button>
              <button type="button" className={viewMode === "single" ? "assets-view-btn is-active" : "assets-view-btn"} title="Single detail" onClick={() => setViewMode("single")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18" /></svg>
              </button>
            </div>

            <div className="assets-columns-wrap" ref={viewWrapRef}>
              <button type="button" className="settings-chip" onClick={() => setShowViewMenu((v) => !v)}>View options</button>
              {showViewMenu ? (
                <div className="assets-columns-menu">
                  <div className="assets-columns-group-title">Thumbnail Size</div>
                  <div className="assets-columns-size-row">
                    <button type="button" className={iconSize === "sm" ? "assets-view-btn is-active" : "assets-view-btn"} onClick={() => setIconSize("sm")}>S</button>
                    <button type="button" className={iconSize === "md" ? "assets-view-btn is-active" : "assets-view-btn"} onClick={() => setIconSize("md")}>M</button>
                    <button type="button" className={iconSize === "lg" ? "assets-view-btn is-active" : "assets-view-btn"} onClick={() => setIconSize("lg")}>L</button>
                  </div>
                  <div className="assets-columns-group-title">Columns</div>
                  {[["name", "Name"], ["type", "Type"], ["size", "Size"], ["modified", "Date Modified"], ["created", "Date Created"], ["path", "Folder Path"]].map(([key, label]) => (
                    <label key={key} className="assets-columns-item">
                      <input type="checkbox" checked={Boolean(columns[key])} onChange={() => setColumns((prev) => ({ ...prev, [key]: !prev[key] }))} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="assets-breadcrumbs">
            <button type="button" className={!activePath ? "assets-crumb is-active" : "assets-crumb"} onClick={() => setActivePath("")}>Root</button>
            {crumbs.map((crumb) => (
              <button key={crumb.path} type="button" className={activePath === crumb.path ? "assets-crumb is-active" : "assets-crumb"} onClick={() => setActivePath(crumb.path)}>{crumb.name}</button>
            ))}
          </div>

          {viewMode === "icons" ? (
            <div className={`assets-icons-grid assets-icons-grid-${iconSize} assets-icons-grid-clean`}>
              {scopedData.items.length ? scopedData.items.map((item) => {
                if (item.kind === "folder") {
                  return (
                    <button key={item.id} type="button" className="assets-clean-item is-folder" onClick={() => openFolder(item.path)} title={item.path}>
                      <span className="assets-folder-glyph" aria-hidden="true">📁</span>
                      <span className="assets-icon-name">{item.name}</span>
                      <small>Folder</small>
                    </button>
                  );
                }
                const file = item.file;
                const type = fileTypeLabel(file);
                return (
                  <button key={file.id} type="button" className={selectedFile?.id === file.id ? "assets-clean-item is-active" : "assets-clean-item"} onClick={() => setSelectedFileId(file.id)} title={file.relpath || file.filename}>
                    {renderThumb(file, iconSize === "lg" ? "lg" : iconSize === "sm" ? "sm" : "md")}
                    <span className="assets-icon-name">{basename(file.relpath || file.filename || file.filename)}</span>
                    <small>{type}</small>
                  </button>
                );
              }) : <div className="settings-muted">{text.noFiles || "No files uploaded."}</div>}
            </div>
          ) : null}

          {viewMode === "list" ? (
            <div className="assets-list-table-wrap">
              <table className="assets-list-table">
                <colgroup>
                  {columns.name ? <col style={{ width: `${colWidths.name}px` }} /> : null}
                  {columns.created ? <col style={{ width: `${colWidths.created}px` }} /> : null}
                  {columns.modified ? <col style={{ width: `${colWidths.modified}px` }} /> : null}
                  {columns.size ? <col style={{ width: `${colWidths.size}px` }} /> : null}
                  {columns.type ? <col style={{ width: `${colWidths.type}px` }} /> : null}
                  {columns.path ? <col style={{ width: `${colWidths.path}px` }} /> : null}
                </colgroup>
                <thead>
                  <tr>
                    {columns.name ? <th onClick={() => onSortColumn("name")} className="assets-th-sort">Name <span>{sortMarker("name")}</span><span className="assets-col-resizer" onMouseDown={(e) => startColumnResize("name", e)} /></th> : null}
                    {columns.created ? <th onClick={() => onSortColumn("created")} className="assets-th-sort">Date Created <span>{sortMarker("created")}</span><span className="assets-col-resizer" onMouseDown={(e) => startColumnResize("created", e)} /></th> : null}
                    {columns.modified ? <th onClick={() => onSortColumn("modified")} className="assets-th-sort">Date Modified <span>{sortMarker("modified")}</span><span className="assets-col-resizer" onMouseDown={(e) => startColumnResize("modified", e)} /></th> : null}
                    {columns.size ? <th onClick={() => onSortColumn("size")} className="assets-th-sort">Size <span>{sortMarker("size")}</span><span className="assets-col-resizer" onMouseDown={(e) => startColumnResize("size", e)} /></th> : null}
                    {columns.type ? <th onClick={() => onSortColumn("type")} className="assets-th-sort">Kind <span>{sortMarker("type")}</span><span className="assets-col-resizer" onMouseDown={(e) => startColumnResize("type", e)} /></th> : null}
                    {columns.path ? <th onClick={() => onSortColumn("path")} className="assets-th-sort">Folder Path <span>{sortMarker("path")}</span><span className="assets-col-resizer" onMouseDown={(e) => startColumnResize("path", e)} /></th> : null}
                  </tr>
                </thead>
                <tbody>
                  {scopedData.items.length ? scopedData.items.map((item) => {
                    if (item.kind === "folder") {
                      return (
                        <tr key={item.id} className="assets-row-folder" onClick={() => openFolder(item.path)}>
                          {columns.name ? <td><span className="assets-list-name"><span className="assets-folder-mini">📁</span><span>{item.name}</span></span></td> : null}
                          {columns.created ? <td>-</td> : null}
                          {columns.modified ? <td>-</td> : null}
                          {columns.size ? <td>-</td> : null}
                          {columns.type ? <td>Folder</td> : null}
                          {columns.path ? <td className="assets-path-cell">{activePath || "/"}</td> : null}
                        </tr>
                      );
                    }
                    const file = item.file;
                    return (
                      <tr key={file.id} className={selectedFile?.id === file.id ? "is-active" : ""} onClick={() => setSelectedFileId(file.id)}>
                        {columns.name ? <td><span className="assets-list-name">{renderThumb(file, "sm")}<span>{basename(file.relpath || file.filename || file.filename)}</span></span></td> : null}
                        {columns.created ? <td>{formatDate(file.created_at)}</td> : null}
                        {columns.modified ? <td>{formatDate(file.created_at)}</td> : null}
                        {columns.size ? <td>{formatBytes(file.size_bytes)}</td> : null}
                        {columns.type ? <td>{fileTypeLabel(file)}</td> : null}
                        {columns.path ? <td className="assets-path-cell">{folderPath(file)}</td> : null}
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={6} className="settings-muted">{text.noFiles || "No files uploaded."}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : null}

          {viewMode === "details" ? (
            <div className="assets-details-layout assets-details-layout-wide">
              <div className="assets-details-list">
                {scopedData.items.map((item) => {
                  if (item.kind === "folder") {
                    return (
                      <button key={item.id} type="button" className="assets-details-row assets-row-folder" onClick={() => openFolder(item.path)}>
                        <span className="assets-details-name"><span className="assets-folder-mini">📁</span><span>{item.name}</span></span>
                        <span>Folder</span>
                        <span>{activePath || "/"}</span>
                      </button>
                    );
                  }
                  const file = item.file;
                  return (
                    <button key={file.id} type="button" className={selectedFile?.id === file.id ? "assets-details-row is-active" : "assets-details-row"} onClick={() => setSelectedFileId(file.id)}>
                      <span className="assets-details-name">{renderThumb(file, "sm")}<span>{basename(file.relpath || file.filename || file.filename)}</span></span>
                      <span>{fileTypeLabel(file)}</span>
                      <span>{formatDate(file.created_at)}</span>
                    </button>
                  );
                })}
              </div>

              <aside className="assets-details-pane">
                {selectedFile ? (
                  <>
                    <h3>{basename(selectedFile.relpath || selectedFile.filename || selectedFile.filename)}</h3>
                    <div className="assets-details-preview assets-details-preview-xl">
                      {selectedPreviewLoading ? (
                        <div className="settings-muted">Loading preview...</div>
                      ) : selectedPreviewUrl ? (
                        selectedMime.toLowerCase().includes("pdf") ? (
                          <iframe title="preview" src={selectedPreviewUrl} className="assets-preview-frame" />
                        ) : (
                          <img src={selectedPreviewUrl} alt={selectedFile.filename} />
                        )
                      ) : (
                        <div className="settings-muted">No preview available.</div>
                      )}
                    </div>
                    <div className="assets-details-meta assets-details-meta-rich">
                      <div><strong>Kind</strong><span>{fileTypeLabel(selectedFile)}</span></div>
                      <div><strong>Size</strong><span>{formatBytes(selectedFile.size_bytes)}</span></div>
                      <div><strong>Date Created</strong><span>{formatDate(selectedFile.created_at)}</span></div>
                      <div><strong>Date Modified</strong><span>{formatDate(selectedFile.created_at)}</span></div>
                      <div><strong>Folder Path</strong><span>{folderPath(selectedFile)}</span></div>
                    </div>
                  </>
                ) : (
                  <div className="settings-muted">{text.noFiles || "No files uploaded."}</div>
                )}
              </aside>
            </div>
          ) : null}

          {viewMode === "single" ? (
            <div className="assets-single-layout assets-single-only">
              <div className="assets-single-preview-pane">
                <div className="assets-single-preview-head">
                  <button type="button" className="assets-view-btn" title="Previous" onClick={() => {
                    const idx = scopedData.files.findIndex((f) => f.id === selectedFile?.id);
                    if (idx > 0) setSelectedFileId(scopedData.files[idx - 1].id);
                  }}>◀</button>
                  <strong>{selectedFile ? basename(selectedFile.relpath || selectedFile.filename || selectedFile.filename) : "-"}</strong>
                  <button type="button" className="assets-view-btn" title="Next" onClick={() => {
                    const idx = scopedData.files.findIndex((f) => f.id === selectedFile?.id);
                    if (idx >= 0 && idx < scopedData.files.length - 1) setSelectedFileId(scopedData.files[idx + 1].id);
                  }}>▶</button>
                </div>
                <div className="assets-single-preview-canvas assets-single-preview-center">
                  {selectedFile ? (
                    selectedPreviewLoading ? (
                      <div className="settings-muted">Loading preview...</div>
                    ) : selectedPreviewUrl ? (
                      selectedMime.toLowerCase().includes("pdf") ? (
                        <iframe title="single-preview" src={selectedPreviewUrl} className="assets-preview-frame" />
                      ) : (
                        <img src={selectedPreviewUrl} alt={selectedFile.filename} />
                      )
                    ) : (
                      <div className="assets-single-fallback">{renderThumb(selectedFile, "lg")}<span>{fileTypeLabel(selectedFile)}</span></div>
                    )
                  ) : (
                    <div className="settings-muted">No files uploaded.</div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
