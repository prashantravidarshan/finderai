import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { clsx } from "../utils/format.js";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import { APP_MESSAGES } from "../config/appConfig.js";

function fmt(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function capitalizeFirstWord(text) {
  if (!text) return "";
  const trimmed = String(text).trim();
  if (!trimmed) return "";
  const firstSpace = trimmed.indexOf(" ");
  if (firstSpace === -1) return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return trimmed.slice(0, firstSpace).charAt(0).toUpperCase() + trimmed.slice(1);
}

function RailIcon({ children }) {
  return <span className="workspace-rail-icon" aria-hidden="true">{children}</span>;
}

function MenuGlyph({ children }) {
  return <span className="workspace-menu-item-icon" aria-hidden="true">{children}</span>;
}

function MenuItem({ label, icon, onClick, danger = false, right }) {
  return (
    <button type="button" className={clsx("workspace-menu-item", danger ? "danger" : "")} onClick={onClick}>
      <span className="workspace-menu-item-label">
        {icon ? <MenuGlyph>{icon}</MenuGlyph> : null}
        <span>{label}</span>
      </span>
      {right ? <span className="workspace-menu-arrow">{right}</span> : null}
    </button>
  );
}

function createFolderId() {
  return `fld_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function SidebarChats({
  copy,
  conversations,
  activeId,
  unreadCounts,
  isSettingsActive,
  activeRailTab = "chats",
  compact = false,
  onNew,
  onOpenFolderPanel,
  onSelect,
  onDelete,
  chatFolders,
  setChatFolders,
  chatFolderMap,
  setChatFolderMap,
  onOpenIndex,
  onOpenFiles,
  onGoSettings,
  onGoProfile,
  onGoDashboard,
  onLogout,
  onUpgradePlan,
  onHelp,
  onNotify,
}) {
  const chatText = copy?.chat || APP_MESSAGES.en.chat;

  const [query, setQuery] = useState("");
  const [chatMenuFor, setChatMenuFor] = useState("");
  const [chatMenuDirection, setChatMenuDirection] = useState("down");
  const [folderMenuFor, setFolderMenuFor] = useState("");
  const [folderMenuDirection, setFolderMenuDirection] = useState("down");
  const [userOpen, setUserOpen] = useState(false);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [showAllFolders, setShowAllFolders] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [chatsOpen, setChatsOpen] = useState(true);
  const [showAllProjectChats, setShowAllProjectChats] = useState(false);
  const [newMenuPos, setNewMenuPos] = useState(null);
  const [chatMenuPos, setChatMenuPos] = useState(null);
  const [folderMenuPos, setFolderMenuPos] = useState(null);
  const [userMenuPos, setUserMenuPos] = useState(null);

  const [titleOverrides, setTitleOverrides] = useLocalStorage("fyndoy_title_overrides", {});
  const [pinnedList, setPinnedList] = useLocalStorage("fyndoy_pinned_chats", []);
  const [archivedList, setArchivedList] = useLocalStorage("fyndoy_archived_chats", []);
  const [fallbackFolders, setFallbackFolders] = useLocalStorage("fyndoy_chat_folders", []);
  const [fallbackFolderMap, setFallbackFolderMap] = useLocalStorage("fyndoy_chat_folder_map", {});
  const foldersState = chatFolders ?? fallbackFolders;
  const setFoldersState = setChatFolders ?? setFallbackFolders;
  const folderMapState = chatFolderMap ?? fallbackFolderMap;
  const setFolderMapState = setChatFolderMap ?? setFallbackFolderMap;

  const [renameModal, setRenameModal] = useState({ open: false, id: "", value: "" });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: "", title: "" });
  const [newFolderModal, setNewFolderModal] = useState({ open: false, name: "" });
  const [moveModal, setMoveModal] = useState({ open: false, id: "", title: "", folderId: "", newFolderName: "" });
  const [folderRenameModal, setFolderRenameModal] = useState({ open: false, id: "", value: "" });
  const [folderDeleteModal, setFolderDeleteModal] = useState({ open: false, id: "", name: "" });

  const userMenuRef = useRef(null);
  const newMenuRef = useRef(null);
  const newMenuPortalRef = useRef(null);
  const chatMenuRef = useRef(null);
  const folderMenuRef = useRef(null);
  const userMenuPortalRef = useRef(null);
  const userButtonRef = useRef(null);

  const pinned = useMemo(() => new Set(Array.isArray(pinnedList) ? pinnedList : []), [pinnedList]);
  const archived = useMemo(() => new Set(Array.isArray(archivedList) ? archivedList : []), [archivedList]);
  const folders = useMemo(() => (Array.isArray(foldersState) ? foldersState : []), [foldersState]);
  const folderById = useMemo(() => {
    const map = new Map();
    for (const folder of folders) map.set(folder.id, folder);
    return map;
  }, [folders]);

  const q = query.trim().toLowerCase();

  useEffect(() => {
    const onDown = (event) => {
      const t = event.target;
      if (userMenuRef.current?.contains(t)) return;
      if (newMenuRef.current?.contains(t)) return;
      if (newMenuPortalRef.current?.contains(t)) return;
      if (chatMenuRef.current?.contains(t)) return;
      if (folderMenuRef.current?.contains(t)) return;
      if (userMenuPortalRef.current?.contains(t)) return;
      setChatMenuFor("");
      setFolderMenuFor("");
      setChatMenuPos(null);
      setFolderMenuPos(null);
      setUserOpen(false);
      setUserMenuPos(null);
      setNewMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function resolveMenuDirection(triggerElement, estimatedHeight = 220) {
    if (!triggerElement || typeof window === "undefined") return "down";
    const triggerRect = triggerElement.getBoundingClientRect();
    const scrollRoot = triggerElement.closest(".chat-list-scroll");
    const hostRect = scrollRoot?.getBoundingClientRect?.() || {
      top: 0,
      bottom: window.innerHeight,
    };
    const spaceBelow = hostRect.bottom - triggerRect.bottom;
    const spaceAbove = triggerRect.top - hostRect.top;
    if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) return "up";
    return "down";
  }

  function notify(message, type = "info") {
    if (!message) return;
    onNotify?.(message, type);
  }

  function ensureFolder(nameRaw) {
    const name = String(nameRaw || "").trim();
    if (!name) return "";

    const existing = folders.find((f) => f.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;

    const id = createFolderId();
    const next = [...folders, { id, name }];
    setFoldersState(next);
    notify(chatText.folderCreated || "Folder created.", "success");
    return id;
  }

  const filtered = useMemo(() => {
    const list = conversations || [];

    const withTitle = list
      .filter((c) => !archived.has(c.conversation_id))
      .map((c) => {
        const cid = c.conversation_id;
        const fallback = cid.slice(0, 10) + "…";
        const rawTitle = titleOverrides[cid] || c.title || fallback;
        const title = capitalizeFirstWord(rawTitle);
        const folderId = folderMapState?.[cid] || "";
        const folderName = folderById.get(folderId)?.name || "";
        const unread = Number(unreadCounts?.[cid] || 0);
        return { ...c, _displayTitle: title, _folderId: folderId, _folderName: folderName, _unread: unread };
      })
      .filter((c) => {
        if (!q) return true;
        return (
          c._displayTitle.toLowerCase().includes(q) ||
          c.conversation_id.toLowerCase().includes(q) ||
          c._folderName.toLowerCase().includes(q)
        );
      });

    withTitle.sort((a, b) => {
      const ap = pinned.has(a.conversation_id) ? 1 : 0;
      const bp = pinned.has(b.conversation_id) ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return (b.last_time || "").localeCompare(a.last_time || "");
    });

    return withTitle;
  }, [archived, folderMapState, conversations, folderById, pinned, q, titleOverrides, unreadCounts]);

  const visibleFolders = useMemo(() => {
    const source = folders || [];
    if (!q) return source;
    return source.filter((f) => f.name.toLowerCase().includes(q));
  }, [folders, q]);

  const folderChats = useMemo(() => {
    if (!selectedFolderId) return [];
    return filtered.filter((c) => c._folderId === selectedFolderId);
  }, [filtered, selectedFolderId]);

  const visibleChats = selectedFolderId
    ? filtered.filter((c) => !c._folderId)
    : filtered.filter((c) => !c._folderId);

  useEffect(() => {
    if (!activeId) return;
    const mappedFolder = folderMapState?.[activeId] || "";
    if (mappedFolder) {
      setSelectedFolderId(mappedFolder);
      setProjectsOpen(true);
      return;
    }
    setSelectedFolderId("");
  }, [activeId, folderMapState]);

  async function doShare(conversationId, title) {
    const text = `${title}\n${conversationId}`;
    try {
      if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(text);
      notify(chatText.shareSuccess || "Chat copied for sharing.", "success");
    } catch {
      notify(chatText.shareFailed || "Copy failed on this browser.", "warning");
    }
  }

  function startRename(conversationId, currentTitle) {
    setRenameModal({ open: true, id: conversationId, value: currentTitle });
    setChatMenuFor("");
  }

  function saveRename() {
    const value = renameModal.value.trim();
    if (!value) return;
    setTitleOverrides((m) => ({ ...m, [renameModal.id]: value }));
    notify(chatText.renameSuccess || "Chat title updated.", "success");
    setRenameModal({ open: false, id: "", value: "" });
  }

  function togglePinned(conversationId) {
    setPinnedList((prev) => {
      const next = new Set(Array.isArray(prev) ? prev : []);
      if (next.has(conversationId)) {
        next.delete(conversationId);
        notify(chatText.unpinned || "Chat unpinned.");
      } else {
        next.add(conversationId);
        notify(chatText.pinnedFlash || "Chat pinned.", "success");
      }
      return Array.from(next);
    });
  }

  function archiveChat(conversationId) {
    setArchivedList((prev) => {
      const next = new Set(Array.isArray(prev) ? prev : []);
      next.add(conversationId);
      return Array.from(next);
    });
    notify(chatText.archiveSuccess || "Chat archived.", "success");
  }

  function startDelete(conversationId, title) {
    setDeleteModal({ open: true, id: conversationId, title });
    setChatMenuFor("");
  }

  async function confirmDelete() {
    if (!deleteModal.id) return;
    await onDelete?.(deleteModal.id);
    setDeleteModal({ open: false, id: "", title: "" });
    notify(chatText.deleteSuccess || "Chat deleted.", "success");
  }

  function openMoveModal(conversationId, title) {
    setMoveModal({
      open: true,
      id: conversationId,
      title,
      folderId: folderMapState?.[conversationId] || "",
      newFolderName: "",
    });
    setChatMenuFor("");
  }

  function saveMoveModal() {
    const convoId = moveModal.id;
    if (!convoId) return;

    let folderId = moveModal.folderId;
    if (folderId === "__new__") {
      folderId = "";
    }
    if (moveModal.newFolderName.trim() || moveModal.folderId === "__new__") {
      folderId = ensureFolder(moveModal.newFolderName);
      if (!folderId) return;
    }

    if (!folderId) {
      setFolderMapState((prev) => {
        const next = { ...(prev || {}) };
        delete next[convoId];
        return next;
      });
      notify(chatText.folderRemoved || "Chat removed from folder.");
    } else {
      setFolderMapState((prev) => ({ ...(prev || {}), [convoId]: folderId }));
      notify(chatText.movedToFolder || "Chat moved to folder.", "success");
    }

    setMoveModal({ open: false, id: "", title: "", folderId: "", newFolderName: "" });
  }

  function createFolderFromModal() {
    const folderId = ensureFolder(newFolderModal.name);
    if (!folderId) return;
    setNewFolderModal({ open: false, name: "" });
    setNewMenuOpen(false);
    setSelectedFolderId(folderId);
    setProjectsOpen(true);
    const chats = filtered.filter((c) => c._folderId === folderId);
    onOpenFolderPanel?.({
      id: folderId,
      name: folders.find((f) => f.id === folderId)?.name || newFolderModal.name,
      chats: chats.map((c) => ({
        conversation_id: c.conversation_id,
        title: c._displayTitle,
        last_time: c.last_time,
        pinned: pinned.has(c.conversation_id),
      })),
    });
  }

  function openFolder(folder) {
    setSelectedFolderId(folder.id);
    setProjectsOpen(true);
    setChatMenuFor("");
    setFolderMenuFor("");
    const chats = filtered.filter((c) => c._folderId === folder.id);
    onOpenFolderPanel?.({
      id: folder.id,
      name: folder.name,
      chats: chats.map((c) => ({
        conversation_id: c.conversation_id,
        title: c._displayTitle,
        last_time: c.last_time,
        pinned: pinned.has(c.conversation_id),
      })),
    });
  }

  function startRenameFolder(folder) {
    setFolderRenameModal({ open: true, id: folder.id, value: folder.name });
    setFolderMenuFor("");
  }

  function unpinFolderChats(folderId) {
    const ids = filtered.filter((c) => c._folderId === folderId).map((c) => c.conversation_id);
    if (!ids.length) return;
    setPinnedList((prev) => {
      const next = new Set(Array.isArray(prev) ? prev : []);
      ids.forEach((id) => next.delete(id));
      return Array.from(next);
    });
    notify(chatText.unpinFolder || "Unpin", "success");
  }

  function archiveFolderChats(folderId) {
    const ids = filtered.filter((c) => c._folderId === folderId).map((c) => c.conversation_id);
    if (!ids.length) return;
    setArchivedList((prev) => {
      const next = new Set(Array.isArray(prev) ? prev : []);
      ids.forEach((id) => next.add(id));
      return Array.from(next);
    });
    notify(chatText.archiveFolder || "Archive", "success");
  }

  function saveRenameFolder() {
    const value = folderRenameModal.value.trim();
    if (!value || !folderRenameModal.id) return;
    setFoldersState((prev) =>
      (Array.isArray(prev) ? prev : []).map((f) =>
        f.id === folderRenameModal.id ? { ...f, name: value } : f
      )
    );
    notify(chatText.folderRenamed || "Folder renamed.", "success");
    setFolderRenameModal({ open: false, id: "", value: "" });
  }

  function startDeleteFolder(folder) {
    setFolderDeleteModal({ open: true, id: folder.id, name: folder.name });
    setFolderMenuFor("");
  }

  function confirmDeleteFolder() {
    const fid = folderDeleteModal.id;
    if (!fid) return;
    setFoldersState((prev) => (Array.isArray(prev) ? prev : []).filter((f) => f.id !== fid));
    setFolderMapState((prev) => {
      const next = { ...(prev || {}) };
      for (const [cid, folderId] of Object.entries(next)) {
        if (folderId === fid) delete next[cid];
      }
      return next;
    });
    if (selectedFolderId === fid) {
      setSelectedFolderId("");
    }
    notify(chatText.folderDeleted || "Folder deleted.", "success");
    setFolderDeleteModal({ open: false, id: "", name: "" });
  }

  function renderChatRow(c, opts = {}) {
    const { inProject = false } = opts;
    const cid = c.conversation_id;
    const isActive = cid === activeId;
    const isPinned = pinned.has(cid);

    const unread = Number(c._unread || 0);
    return (
      <div
        key={cid}
        className={clsx(
          "workspace-chat-row group relative border",
          inProject ? "workspace-chat-row-project" : "",
          isActive ? "is-active" : "",
          isPinned ? "is-pinned" : ""
        )}
        role="button"
        tabIndex={0}
        onClick={() => onSelect(cid)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(cid);
          }
        }}
      >
        <div className="workspace-chat-row-head">
          <div className="workspace-chat-name">{c._displayTitle}</div>
          <div className="workspace-chat-time-wrap">
            {isPinned ? (
              <span className="workspace-chat-pin-icon" title={chatText.pinChat || "Pinned"}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 4v4l3 3v2H7v-2l3-3V4h4Z" />
                  <path d="M12 13v7" />
                </svg>
              </span>
            ) : null}
            {unread ? <span className="workspace-chat-unread">{unread}</span> : null}
            <div className="workspace-chat-time">{fmt(c.last_time)}</div>
            <div className="workspace-chat-actions">
              <button
                type="button"
                className="workspace-chat-actions-btn"
                title={chatText.chatOptions || "Chat options"}
                onClick={(e) => {
                  e.stopPropagation();
                  const nextOpen = chatMenuFor !== cid;
                  if (nextOpen) {
                    const direction = resolveMenuDirection(e.currentTarget);
                    setChatMenuDirection(direction);
                    setChatMenuFor(cid);
                    setChatMenuPos(calcMenuPosition(e.currentTarget, direction, 210, 240));
                  } else {
                    setChatMenuFor("");
                  }
                  setFolderMenuFor("");
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
              {chatMenuFor === cid && chatMenuPos && modalRoot ? createPortal(
                <div
                  ref={chatMenuRef}
                  className="workspace-popover workspace-chat-actions-menu"
                  style={chatMenuPos}
                >
                  <MenuItem
                    label={chatText.share || "Share"}
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 12 16 7M8 12l8 5" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="7" r="2" /><circle cx="18" cy="17" r="2" /></svg>}
                    onClick={() => { doShare(cid, c._displayTitle); setChatMenuFor(""); }}
                  />
                  <MenuItem
                    label={chatText.rename || "Rename"}
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="m16.5 3.5 4 4L8 20l-4 1 1-4Z" /></svg>}
                    onClick={() => startRename(cid, c._displayTitle)}
                  />
                  <MenuItem
                    label={chatText.moveToFolder || "Move to Project"}
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /><path d="m9 12 3 3 3-3" /></svg>}
                    onClick={() => openMoveModal(cid, c._displayTitle)}
                  />
                  {c._folderId ? (
                    <MenuItem
                      label={chatText.removeFromFolder || "Remove from Project"}
                      icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2" /><path d="M9 14h12" /><path d="M18 11l3 3-3 3" /></svg>}
                      onClick={() => {
                        setFolderMapState((prev) => {
                          const next = { ...(prev || {}) };
                          delete next[cid];
                          return next;
                        });
                        notify(chatText.folderRemoved || "Chat removed from project.", "success");
                        setChatMenuFor("");
                      }}
                    />
                  ) : null}
                  <MenuItem
                    label={isPinned ? (chatText.unpinChat || "Unpin Chat") : (chatText.pinChat || "Pin Chat")}
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 4v4l3 3v2H7v-2l3-3V4h4Z" /><path d="M12 13v7" /></svg>}
                    onClick={() => { togglePinned(cid); setChatMenuFor(""); }}
                  />
                  <MenuItem
                    label={chatText.archive || "Archive"}
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h18v3H3z" /><path d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" /><path d="M10 14h4" /></svg>}
                    onClick={() => { archiveChat(cid); setChatMenuFor(""); }}
                  />
                  <MenuItem
                    label={chatText.delete || "Delete"}
                    danger
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></svg>}
                    onClick={() => startDelete(cid, c._displayTitle)}
                  />
                </div>,
                modalRoot
              ) : null}
            </div>
          </div>
        </div>
        {c._folderName && !inProject ? (
          <div className="workspace-chat-row-meta">
            <span className="workspace-folder-badge">{c._folderName}</span>
          </div>
        ) : null}

      </div>
    );
  }

  function renderFolderRow(folder) {
    const isActive = selectedFolderId === folder.id;
    return (
      <div
        key={folder.id}
        className={clsx("workspace-chat-row workspace-folder-row group relative", isActive ? "is-active" : "")}
        role="button"
        tabIndex={0}
        onClick={() => openFolder(folder)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFolder(folder);
          }
        }}
      >
        <div className="workspace-chat-row-head">
          <div className="workspace-chat-name">{folder.name}</div>
          <div className="workspace-chat-time-wrap">
            <div className="workspace-chat-actions">
              <button
                type="button"
                className="workspace-chat-actions-btn"
                title={chatText.projectOptions || chatText.folderOptions || "Project options"}
                onClick={(e) => {
                  e.stopPropagation();
                  const nextOpen = folderMenuFor !== folder.id;
                  if (nextOpen) {
                    const direction = resolveMenuDirection(e.currentTarget, 170);
                    setFolderMenuDirection(direction);
                    setFolderMenuFor(folder.id);
                    setFolderMenuPos(calcMenuPosition(e.currentTarget, direction, 200, 210));
                  } else {
                    setFolderMenuFor("");
                  }
                  setChatMenuFor("");
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
              {folderMenuFor === folder.id && folderMenuPos && modalRoot ? createPortal(
                <div className="workspace-popover workspace-chat-actions-menu" style={folderMenuPos} ref={folderMenuRef}>
                  <MenuItem
                    label={chatText.share || "Share"}
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 12 16 7M8 12l8 5" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="7" r="2" /><circle cx="18" cy="17" r="2" /></svg>}
                    onClick={() => {
                      doShare(folder.id, folder.name);
                      setFolderMenuFor("");
                    }}
                  />
                  <MenuItem
                    label={chatText.renameFolder || chatText.rename || "Rename"}
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="m16.5 3.5 4 4L8 20l-4 1 1-4Z" /></svg>}
                    onClick={() => startRenameFolder(folder)}
                  />
                  <MenuItem
                    label={chatText.unpinFolder || "Unpin"}
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 4v4l3 3v2H7v-2l3-3V4h4Z" /><path d="m6 6 12 12" /></svg>}
                    onClick={() => {
                      unpinFolderChats(folder.id);
                      setFolderMenuFor("");
                    }}
                  />
                  <MenuItem
                    label={chatText.archiveFolder || "Archive"}
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h18v3H3z" /><path d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" /><path d="M10 14h4" /></svg>}
                    onClick={() => {
                      archiveFolderChats(folder.id);
                      setFolderMenuFor("");
                    }}
                  />
                  <MenuItem
                    label={chatText.deleteFolder || chatText.delete || "Delete"}
                    danger
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></svg>}
                    onClick={() => startDeleteFolder(folder)}
                  />
                </div>,
                modalRoot
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const modalRoot = typeof document !== "undefined" ? document.body : null;

  function calcMenuPosition(trigger, direction = "down", width = 190, height = 220) {
    if (!trigger || typeof window === "undefined") return null;
    const rect = trigger.getBoundingClientRect();
    const left = Math.min(Math.max(12, rect.right - width), window.innerWidth - width - 12);
    let top = direction === "up" ? rect.top - height - 8 : rect.bottom + 8;
    top = Math.min(Math.max(12, top), window.innerHeight - height - 12);
    return { position: "fixed", top: `${top}px`, left: `${left}px`, width: `${width}px`, zIndex: 260 };
  }

  return (
    <div className="flex h-[42vh] min-h-[360px] flex-col lg:h-full">
      <div className="flex min-h-0 flex-1">
        <div className="workspace-rail flex w-[72px] shrink-0 flex-col items-center border-r border-[var(--border-color)] py-4">
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              className={clsx("workspace-rail-btn", activeRailTab === "chats" ? "is-active" : "")}
              data-tip={chatText.tabChats || "Chats"}
              onClick={onGoDashboard}
            >
              <RailIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17l-4 3V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7Z" />
                </svg>
              </RailIcon>
            </button>
            <button type="button" className={clsx("workspace-rail-btn", activeRailTab === "index" ? "is-active" : "")} data-tip={chatText.tabIndex || "Index"} onClick={onOpenIndex}>
              <RailIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16v4H4zM4 10h16v10H4z" />
                  <path d="M8 14h8M8 18h6" />
                </svg>
              </RailIcon>
            </button>
            <button type="button" className={clsx("workspace-rail-btn", activeRailTab === "files" ? "is-active" : "")} data-tip={chatText.tabFiles || "Files"} onClick={onOpenFiles}>
              <RailIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
                </svg>
              </RailIcon>
            </button>
          </div>

          <div className="mt-auto flex flex-col items-center gap-3" ref={userMenuRef}>
            <button
              type="button"
              className={clsx("workspace-rail-btn", isSettingsActive ? "workspace-rail-btn-premium is-active" : "")}
              data-tip={chatText.tabSettings || "Settings"}
              onClick={onGoSettings}
            >
              <RailIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 12a7.4 7.4 0 0 0 .1-1l2-1.5-2-3.5-2.4.7a7.6 7.6 0 0 0-1.7-1l-.4-2.5h-4l-.4 2.5a7.6 7.6 0 0 0-1.7 1l-2.4-.7-2 3.5 2 1.5a7.4 7.4 0 0 0 0 2l-2 1.5 2 3.5 2.4-.7a7.6 7.6 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7.6 7.6 0 0 0 1.7-1l2.4.7 2-3.5-2-1.5c.07-.33.1-.66.1-1Z" />
                </svg>
              </RailIcon>
            </button>

            <button
              type="button"
              className={clsx("workspace-rail-btn", userOpen ? "is-open" : "")}
              data-tip={chatText.tabAccount || "Account"}
              onClick={(e) => {
                const next = !userOpen;
                setUserOpen(next);
                if (next) setUserMenuPos(calcMenuPosition(e.currentTarget, "up", 200, 190));
              }}
              ref={userButtonRef}
            >
              <RailIcon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20a7 7 0 0 1 14 0" />
                </svg>
              </RailIcon>
            </button>
            {userOpen && modalRoot && userMenuPos ? createPortal(
              <div className="workspace-popover workspace-user-menu" style={userMenuPos} ref={userMenuPortalRef}>
                <MenuItem
                  label={chatText.profile || "Profile"}
                  icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>}
                  onClick={() => {
                    setUserOpen(false);
                    onGoProfile?.();
                  }}
                />
                <MenuItem
                  label={chatText.upgrade || "Upgrade plan"}
                  icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3 4 9l8 12 8-12-8-6Z" /><path d="M8 12h8" /></svg>}
                  onClick={onUpgradePlan}
                />
                <MenuItem
                  label={chatText.help || "Help"}
                  icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M9.2 9a3 3 0 0 1 5.6 1.4c0 2-2.8 2.2-2.8 4.1" /><circle cx="12" cy="17.2" r=".7" /></svg>}
                  onClick={onHelp}
                />
                <MenuItem
                  label={chatText.logout || "Logout"}
                  danger
                  icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>}
                  onClick={onLogout}
                />
              </div>,
              modalRoot
            ) : null}
          </div>
        </div>

        {compact ? null : (
          <div className="min-w-0 flex-1 bg-[color-mix(in_srgb,var(--surface-card)_86%,transparent)] flex flex-col">
          <div className="border-b border-[var(--border-color)] px-4 py-4">
            <div className="workspace-chat-head">
              <div className="workspace-chat-brand" aria-label="Fyndoy Smart Finder">
                <span className="workspace-chat-brand-mark" aria-hidden="true">FQ</span>
                <span className="workspace-chat-brand-text">
                  <strong>Fyndoy</strong>
                  <small>SMART FINDER</small>
                </span>
              </div>
              <div className="workspace-chat-head-actions">
                <button
                  type="button"
                  className="workspace-icon-btn"
                  aria-label={chatText.newChat || "New chat"}
                  title={chatText.newChat || "New chat"}
                  onClick={() => onNew?.(selectedFolderId)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
                <div className="workspace-new-menu-wrap" ref={newMenuRef}>
                  <button
                    type="button"
                    className="workspace-icon-btn"
                    aria-label={chatText.newMenu || "More"}
                    title={chatText.newMenu || "More"}
                    onClick={(e) => {
                      const next = !newMenuOpen;
                      setNewMenuOpen(next);
                      if (next) setNewMenuPos(calcMenuPosition(e.currentTarget, "down", 190, 140));
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="5" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="19" r="1.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="workspace-chat-toolbar">
              <div className="workspace-chat-search">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  className="workspace-chat-search-input"
                  placeholder={chatText.searchChats || "Search chats"}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="chat-list-scroll min-h-0 flex-1 overflow-auto px-2 py-2">
            <section className="workspace-chat-section">
                <div className="workspace-section-head">
                  <div className="workspace-section-title">
                    <h3>{chatText.projects || "Projects"}</h3>
                    <button
                      type="button"
                      className="workspace-section-toggle"
                      onClick={() => setProjectsOpen((v) => !v)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                  </div>
                </div>
                {visibleFolders.length ? (
                  <>
                    {projectsOpen ? (
                      <div className="workspace-chat-list">
                        {(showAllFolders ? visibleFolders : visibleFolders.slice(0, 5)).map((folder) => {
                          const isActive = selectedFolderId === folder.id;
                          const projectChats = filtered.filter((c) => c._folderId === folder.id);
                          return (
                            <div key={folder.id} className="workspace-project-block">
                              {renderFolderRow(folder)}
                              {isActive ? (
                                <ul className="workspace-project-chat-list">
                                  {(showAllProjectChats ? projectChats : projectChats.slice(0, 3)).map((chat) => (
                                    <li key={chat.conversation_id} className="workspace-project-chat-li">
                                      <div
                                        onClick={() => setSelectedFolderId(folder.id)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            setSelectedFolderId(folder.id);
                                          }
                                        }}
                                        role="presentation"
                                      >
                                        {renderChatRow(chat, { inProject: true })}
                                      </div>
                                    </li>
                                  ))}
                                  {projectChats.length > 3 ? (
                                    <li>
                                      <button
                                        type="button"
                                        className="workspace-project-more"
                                        onClick={() => setShowAllProjectChats((v) => !v)}
                                      >
                                        {showAllProjectChats ? (chatText.showLessProjects || "Show less") : (chatText.moreProjects || "More")}
                                      </button>
                                    </li>
                                  ) : null}
                                </ul>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                    {projectsOpen && visibleFolders.length > 5 ? (
                      <button
                        type="button"
                        className="workspace-section-action workspace-folder-more-btn"
                        onClick={() => setShowAllFolders((v) => !v)}
                      >
                        {showAllFolders ? (chatText.showLessProjects || "Show less") : (chatText.moreProjects || "More")}
                      </button>
                    ) : null}
                  </>
                ) : (
                  <div className="px-2 pt-1 text-xs text-[var(--text-muted)]">
                    {chatText.noProjects || "No projects yet."}
                  </div>
                )}
            </section>

            <section className="workspace-chat-section">
              <div className="workspace-section-head">
                <div className="workspace-section-title">
                  <h3>{chatText.allChats || "All chats"}</h3>
                  <button
                    type="button"
                    className="workspace-section-toggle"
                    onClick={() => setChatsOpen((v) => !v)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </div>
              </div>
              {chatsOpen ? (
                visibleChats.length ? (
                  <div className="workspace-chat-list">{visibleChats.map((c) => renderChatRow(c))}</div>
                ) : (
                  <div className="px-2 pt-2 text-sm text-[var(--text-muted)]">
                    {q ? (chatText.noMatch || "No matching chats.") : (chatText.noChats || "No chats yet.")}
                  </div>
                )
              ) : null}
            </section>
          </div>
        </div>
        )}
      </div>

      {modalRoot && newMenuOpen && newMenuPos ? createPortal(
        <div className="workspace-popover workspace-new-menu" style={newMenuPos} ref={newMenuPortalRef}>
          <MenuItem
            label={chatText.newChat || "New chat"}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>}
            onClick={() => { onNew?.(selectedFolderId); setNewMenuOpen(false); }}
          />
          <MenuItem
            label={chatText.newFolder || "New project"}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /><path d="M12 10v6M9 13h6" /></svg>}
            onClick={() => { setNewFolderModal({ open: true, name: "" }); setNewMenuOpen(false); }}
          />
        </div>,
        modalRoot
      ) : null}

      {modalRoot && renameModal.open ? createPortal(
        <div className="workspace-modal-backdrop">
          <div className="workspace-modal-card">
            <h3>{chatText.rename || "Rename"}</h3>
            <input
              className="settings-field"
              value={renameModal.value}
              onChange={(e) => setRenameModal((prev) => ({ ...prev, value: e.target.value }))}
              placeholder={chatText.renamePlaceholder || "Chat title"}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveRename();
                }
              }}
            />
            <div className="workspace-modal-actions">
              <button className="workspace-modal-btn" onClick={() => setRenameModal({ open: false, id: "", value: "" })}>{chatText.cancel || "Cancel"}</button>
              <button className="workspace-modal-btn is-primary" onClick={saveRename}>{chatText.save || "Save"}</button>
            </div>
          </div>
        </div>,
        modalRoot
      ) : null}

      {modalRoot && deleteModal.open ? createPortal(
        <div className="workspace-modal-backdrop">
          <div className="workspace-modal-card">
            <h3>{chatText.deleteConfirmTitle || "Delete chat?"}</h3>
            <p>{deleteModal.title}</p>
            <div className="workspace-modal-actions">
              <button className="workspace-modal-btn" onClick={() => setDeleteModal({ open: false, id: "", title: "" })}>{chatText.cancel || "Cancel"}</button>
              <button className="workspace-modal-btn is-danger" onClick={confirmDelete}>{chatText.delete || "Delete"}</button>
            </div>
          </div>
        </div>,
        modalRoot
      ) : null}

      {modalRoot && newFolderModal.open ? createPortal(
        <div className="workspace-modal-backdrop">
          <div className="workspace-modal-card">
            <h3>{chatText.newFolder || "New folder"}</h3>
            <input
              className="settings-field"
              value={newFolderModal.name}
              onChange={(e) => setNewFolderModal((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={chatText.folderNamePlaceholder || "Folder name"}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  createFolderFromModal();
                }
              }}
            />
            <div className="workspace-modal-actions">
              <button className="workspace-modal-btn" onClick={() => setNewFolderModal({ open: false, name: "" })}>{chatText.cancel || "Cancel"}</button>
              <button className="workspace-modal-btn is-primary" onClick={createFolderFromModal}>{chatText.createFolder || "Create"}</button>
            </div>
          </div>
        </div>,
        modalRoot
      ) : null}

      {modalRoot && moveModal.open ? createPortal(
        <div className="workspace-modal-backdrop">
          <div className="workspace-modal-card">
            <h3>{chatText.moveToFolderTitle || chatText.moveToFolder || "Move to Folder"}</h3>
            <p>{moveModal.title}</p>
            <select
              className="settings-field"
              value={moveModal.folderId}
              onChange={(e) => setMoveModal((prev) => ({ ...prev, folderId: e.target.value }))}
            >
              <option value="">{chatText.noFolderOption || "No folder"}</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
              <option value="__new__">{chatText.createNewFolderOption || "Create a new folder..."}</option>
            </select>
            {(moveModal.folderId === "__new__" || moveModal.newFolderName.trim()) ? (
              <input
                className="settings-field"
                value={moveModal.newFolderName}
                onChange={(e) => setMoveModal((prev) => ({ ...prev, newFolderName: e.target.value }))}
                placeholder={chatText.folderNamePlaceholder || "Or create folder"}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveMoveModal();
                  }
                }}
              />
            ) : null}
            <div className="workspace-modal-actions">
              <button className="workspace-modal-btn" onClick={() => setMoveModal({ open: false, id: "", title: "", folderId: "", newFolderName: "" })}>{chatText.cancel || "Cancel"}</button>
              <button className="workspace-modal-btn is-primary" onClick={saveMoveModal}>{chatText.move || "Move"}</button>
            </div>
          </div>
        </div>,
        modalRoot
      ) : null}

      {modalRoot && folderRenameModal.open ? createPortal(
        <div className="workspace-modal-backdrop">
          <div className="workspace-modal-card">
            <h3>{chatText.renameFolder || chatText.rename || "Rename folder"}</h3>
            <input
              className="settings-field"
              value={folderRenameModal.value}
              onChange={(e) => setFolderRenameModal((prev) => ({ ...prev, value: e.target.value }))}
              placeholder={chatText.folderNamePlaceholder || "Folder name"}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveRenameFolder();
                }
              }}
            />
            <div className="workspace-modal-actions">
              <button className="workspace-modal-btn" onClick={() => setFolderRenameModal({ open: false, id: "", value: "" })}>{chatText.cancel || "Cancel"}</button>
              <button className="workspace-modal-btn is-primary" onClick={saveRenameFolder}>{chatText.save || "Save"}</button>
            </div>
          </div>
        </div>,
        modalRoot
      ) : null}

      {modalRoot && folderDeleteModal.open ? createPortal(
        <div className="workspace-modal-backdrop">
          <div className="workspace-modal-card">
            <h3>{chatText.deleteFolderTitle || "Delete folder?"}</h3>
            <p>{folderDeleteModal.name}</p>
            <div className="workspace-modal-actions">
              <button className="workspace-modal-btn" onClick={() => setFolderDeleteModal({ open: false, id: "", name: "" })}>{chatText.cancel || "Cancel"}</button>
              <button className="workspace-modal-btn is-danger" onClick={confirmDeleteFolder}>{chatText.delete || "Delete"}</button>
            </div>
          </div>
        </div>,
        modalRoot
      ) : null}
    </div>
  );
}
