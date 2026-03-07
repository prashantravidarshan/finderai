import React, { useEffect, useMemo, useState } from "react";
import { apiJson } from "../../api/client.js";
import { APP_MESSAGES } from "../../config/appConfig.js";

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
  if (type === "PDF") return "📄";
  if (type === "Image") return "🖼️";
  if (type === "Sheet") return "📊";
  if (type === "Document") return "📝";
  if (type === "Text") return "📃";
  return "📁";
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
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [columns, setColumns] = useState({
    name: true,
    type: true,
    size: true,
    modified: true,
    path: true,
  });
  const [err, setErr] = useState("");

  useEffect(() => {
    setActiveTab(defaultTab === "indexing" ? "indexing" : "files");
  }, [defaultTab]);

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
    if (!files?.length) {
      setSelectedFileId(null);
      return;
    }
    if (!files.some((f) => f.id === selectedFileId)) {
      setSelectedFileId(files[0].id);
    }
  }, [files, selectedFileId]);

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
        const path = String(file.relpath || file.filename || "").toLowerCase();
        const type = fileTypeLabel(file).toLowerCase();
        return path.includes(q) || type.includes(q);
      });
    }
    if (ext !== "all") {
      rows = rows.filter((file) => extensionOf(file.filename || "") === ext);
    }
    return sortFiles(rows, sortBy);
  }, [files, search, ext, sortBy]);

  const selectedFile = filteredFiles.find((f) => f.id === selectedFileId) || filteredFiles[0] || null;
  const roots = status?.roots || [];

  return (
    <div className="assets-page">
      <header className="assets-page-head">
        <div className="assets-page-tabs">
          <button
            type="button"
            className={activeTab === "indexing" ? "assets-tab is-active" : "assets-tab"}
            onClick={() => setActiveTab("indexing")}
          >
            {copy?.settings?.sources?.title || "Connected Folders"}
          </button>
          <button
            type="button"
            className={activeTab === "files" ? "assets-tab is-active" : "assets-tab"}
            onClick={() => setActiveTab("files")}
          >
            {text.files || "Files"}
          </button>
        </div>
        <button type="button" className="settings-chip" onClick={() => { refreshIndex(); onRefreshFiles?.(); }}>
          {text.refresh || "Refresh"}
        </button>
      </header>

      {err ? <div className="settings-error">{err}</div> : null}

      {activeTab === "indexing" ? (
        <section className="assets-indexing-wrap">
          <div className="settings-v2-source-connect">
            <input
              className="settings-field"
              value={sourcePath}
              onChange={(e) => setSourcePath(e.target.value)}
              placeholder={copy?.settings?.sources?.pastePath || "Paste folder path"}
            />
            <button type="button" className="settings-chip" onClick={browseFolder} disabled={sourceBusy || !token}>
              {copy?.settings?.sources?.browse || "Browse"}
            </button>
            <button type="button" className="settings-save" onClick={connectFolder} disabled={sourceBusy || !token || !sourcePath.trim()}>
              {copy?.settings?.sources?.connectNow || "Connect now"}
            </button>
          </div>

          <div className="settings-v2-actions-row">
            <button type="button" className="settings-chip" onClick={resyncAll} disabled={sourceBusy || !roots.length}>
              {copy?.settings?.sources?.resyncAll || "Resync all"}
            </button>
            <span className="settings-muted">
              {loading ? (copy?.settings?.common?.loading || "Loading...") : ""}
            </span>
          </div>

          <div className="settings-v2-list">
            {roots.length ? roots.map((root) => (
              <article key={root.root_path} className="settings-v2-list-item">
                <div className="settings-v2-list-head">
                  <strong>{root.root_path}</strong>
                  <span>{root.in_progress ? (copy?.settings?.sources?.indexing || "Indexing...") : (copy?.settings?.sources?.ready || "Ready")}</span>
                </div>
                <div className="settings-v2-list-meta">
                  <span>{copy?.settings?.sources?.indexedFiles || "Indexed files"}: {root.indexed_files ?? 0}</span>
                  <span>{copy?.settings?.sources?.lastIndexed || "Last indexed"}: {formatDate(root.last_scan_at || root.created_at)}</span>
                </div>
                <div className="settings-v2-actions-row">
                  <button type="button" className="settings-chip" onClick={() => resyncFolder(root.root_path)} disabled={sourceBusy}>
                    {copy?.settings?.sources?.resync || "Resync"}
                  </button>
                  <button type="button" className="settings-chip danger" onClick={() => removeFolder(root.root_path)} disabled={sourceBusy}>
                    {copy?.settings?.sources?.remove || "Remove"}
                  </button>
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
              <input
                className="workspace-chat-search-input"
                placeholder={copy?.settings?.common?.search || "Search"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select className="settings-field assets-select" value={ext} onChange={(e) => setExt(e.target.value)}>
              <option value="all">All extensions</option>
              {extensions.map((extName) => (
                <option key={extName} value={extName}>.{extName}</option>
              ))}
            </select>

            <select className="settings-field assets-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date_desc">Date: Newest</option>
              <option value="date_asc">Date: Oldest</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
              <option value="size_desc">Size: Large to small</option>
              <option value="size_asc">Size: Small to large</option>
              <option value="type_asc">Type: A to Z</option>
            </select>

            <div className="assets-view-toggle">
              <button
                type="button"
                className={viewMode === "icons" ? "assets-view-btn is-active" : "assets-view-btn"}
                title="Icons"
                onClick={() => setViewMode("icons")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="8" height="8" />
                  <rect x="13" y="3" width="8" height="8" />
                  <rect x="3" y="13" width="8" height="8" />
                  <rect x="13" y="13" width="8" height="8" />
                </svg>
              </button>
              <button
                type="button"
                className={viewMode === "list" ? "assets-view-btn is-active" : "assets-view-btn"}
                title="List"
                onClick={() => setViewMode("list")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 6h13M8 12h13M8 18h13" />
                  <path d="M3 6h.01M3 12h.01M3 18h.01" />
                </svg>
              </button>
              <button
                type="button"
                className={viewMode === "details" ? "assets-view-btn is-active" : "assets-view-btn"}
                title="Details"
                onClick={() => setViewMode("details")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18" />
                  <path d="M3 12h18" />
                  <path d="M3 18h12" />
                </svg>
              </button>
            </div>

            <div className="assets-columns-wrap">
              <button type="button" className="settings-chip" onClick={() => setShowColumnsMenu((v) => !v)}>
                Columns
              </button>
              {showColumnsMenu ? (
                <div className="workspace-popover assets-columns-menu">
                  {[
                    ["name", "Name"],
                    ["type", "Type"],
                    ["size", "Size"],
                    ["modified", "Date Modified"],
                    ["path", "Path"],
                  ].map(([key, label]) => (
                    <label key={key} className="assets-columns-item">
                      <input
                        type="checkbox"
                        checked={Boolean(columns[key])}
                        onChange={() => setColumns((prev) => ({ ...prev, [key]: !prev[key] }))}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {viewMode === "icons" ? (
            <div className="assets-icons-grid">
              {filteredFiles.length ? filteredFiles.map((file) => {
                const type = fileTypeLabel(file);
                return (
                  <button
                    key={file.id}
                    type="button"
                    className={selectedFile?.id === file.id ? "assets-icon-item is-active" : "assets-icon-item"}
                    onClick={() => setSelectedFileId(file.id)}
                    title={file.relpath || file.filename}
                  >
                    <span className="assets-icon-glyph">{fileIcon(type)}</span>
                    <span className="assets-icon-name">{file.filename}</span>
                    <small>{type}</small>
                  </button>
                );
              }) : <div className="settings-muted">{text.noFiles || "No files uploaded."}</div>}
            </div>
          ) : null}

          {viewMode === "list" ? (
            <div className="assets-list-table-wrap">
              <table className="assets-list-table">
                <thead>
                  <tr>
                    {columns.name ? <th>Name</th> : null}
                    {columns.modified ? <th>Date Modified</th> : null}
                    {columns.size ? <th>Size</th> : null}
                    {columns.type ? <th>Kind</th> : null}
                    {columns.path ? <th>Path</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.length ? filteredFiles.map((file) => (
                    <tr key={file.id} className={selectedFile?.id === file.id ? "is-active" : ""} onClick={() => setSelectedFileId(file.id)}>
                      {columns.name ? <td>{file.filename}</td> : null}
                      {columns.modified ? <td>{formatDate(file.created_at)}</td> : null}
                      {columns.size ? <td>{formatBytes(file.size_bytes)}</td> : null}
                      {columns.type ? <td>{fileTypeLabel(file)}</td> : null}
                      {columns.path ? <td className="assets-path-cell">{file.relpath || file.filename}</td> : null}
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="settings-muted">{text.noFiles || "No files uploaded."}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : null}

          {viewMode === "details" ? (
            <div className="assets-details-layout">
              <div className="assets-details-list">
                {filteredFiles.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    className={selectedFile?.id === file.id ? "assets-details-row is-active" : "assets-details-row"}
                    onClick={() => setSelectedFileId(file.id)}
                  >
                    <span className="assets-details-name">{file.filename}</span>
                    <span>{fileTypeLabel(file)}</span>
                    <span>{formatDate(file.created_at)}</span>
                  </button>
                ))}
              </div>

              <aside className="assets-details-pane">
                {selectedFile ? (
                  <>
                    <h3>{selectedFile.filename}</h3>
                    <div className="assets-details-meta">
                      <div><strong>Kind</strong><span>{fileTypeLabel(selectedFile)}</span></div>
                      <div><strong>Size</strong><span>{formatBytes(selectedFile.size_bytes)}</span></div>
                      <div><strong>Modified</strong><span>{formatDate(selectedFile.created_at)}</span></div>
                      <div><strong>Path</strong><span>{selectedFile.relpath || selectedFile.filename}</span></div>
                    </div>
                  </>
                ) : (
                  <div className="settings-muted">{text.noFiles || "No files uploaded."}</div>
                )}
              </aside>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
