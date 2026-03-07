import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { APP_MESSAGES } from "../../config/appConfig.js";
import { useLocalStorage } from "../../hooks/useLocalStorage.js";
import { clsx } from "../../utils/format.js";

function fmt(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function createFolderId() {
  return `fld_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function MenuItem({ label, icon, onClick, danger = false }) {
  return (
    <button type="button" className={clsx("workspace-menu-item", danger ? "danger" : "")} onClick={onClick}>
      <span className="workspace-menu-item-label">
        {icon ? <span className="workspace-menu-item-icon" aria-hidden="true">{icon}</span> : null}
        <span>{label}</span>
      </span>
    </button>
  );
}

export default function FolderBoard({
  folder,
  activeId,
  onOpenChat,
  onNewChat,
  onDeleteChat,
  onNotify,
  copy,
  chatFolders,
  setChatFolders,
  chatFolderMap,
  setChatFolderMap,
}) {
  const chatText = copy?.chat || APP_MESSAGES.en.chat;
  const [menuFor, setMenuFor] = useState("");
  const [menuDirection, setMenuDirection] = useState("down");
  const [menuPos, setMenuPos] = useState(null);
  const [renameModal, setRenameModal] = useState({ open: false, id: "", value: "" });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: "", title: "" });
  const [moveModal, setMoveModal] = useState({ open: false, id: "", title: "", folderId: "", newFolderName: "" });
  const rootRef = useRef(null);
  const menuRef = useRef(null);

  const [titleOverrides, setTitleOverrides] = useLocalStorage("fyndoy_title_overrides", {});
  const [pinnedList, setPinnedList] = useLocalStorage("fyndoy_pinned_chats", []);
  const [archivedList, setArchivedList] = useLocalStorage("fyndoy_archived_chats", []);
  const [fallbackFolders, setFallbackFolders] = useLocalStorage("fyndoy_chat_folders", []);
  const [fallbackFolderMap, setFallbackFolderMap] = useLocalStorage("fyndoy_chat_folder_map", {});
  const foldersState = chatFolders ?? fallbackFolders;
  const setFoldersState = setChatFolders ?? setFallbackFolders;
  const folderMapState = chatFolderMap ?? fallbackFolderMap;
  const setFolderMapState = setChatFolderMap ?? setFallbackFolderMap;

  const pinned = useMemo(() => new Set(Array.isArray(pinnedList) ? pinnedList : []), [pinnedList]);
  const archived = useMemo(() => new Set(Array.isArray(archivedList) ? archivedList : []), [archivedList]);
  const folders = useMemo(() => (Array.isArray(foldersState) ? foldersState : []), [foldersState]);

  const chats = useMemo(() => {
    return (folder?.chats || []).filter((c) => !archived.has(c.conversation_id)).map((c) => {
      const override = titleOverrides?.[c.conversation_id];
      return { ...c, _title: override || c.title || c.conversation_id };
    });
  }, [archived, folder, titleOverrides]);

  useEffect(() => {
    function onDown(event) {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target)) return;
      if (menuRef.current?.contains(event.target)) return;
      setMenuFor("");
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function notify(msg, type = "info") {
    if (!msg) return;
    onNotify?.(msg, type);
  }

  async function doShare(chatId, title) {
    const text = `${title}\n${chatId}`;
    try {
      if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(text);
      notify(chatText.shareSuccess || "Chat copied for sharing.", "success");
    } catch {
      notify(chatText.shareFailed || "Copy failed on this browser.", "warning");
    }
  }

  function resolveMenuDirection(triggerElement, estimatedHeight = 220) {
    if (!triggerElement || typeof window === "undefined") return "down";
    const triggerRect = triggerElement.getBoundingClientRect();
    const scrollRoot = triggerElement.closest(".folder-board-wrap");
    const hostRect = scrollRoot?.getBoundingClientRect?.() || {
      top: 0,
      bottom: window.innerHeight,
    };
    const spaceBelow = hostRect.bottom - triggerRect.bottom;
    const spaceAbove = triggerRect.top - hostRect.top;
    if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) return "up";
    return "down";
  }

  function calcMenuPosition(trigger, direction = "down", width = 190, height = 220) {
    if (!trigger || typeof window === "undefined") return null;
    const rect = trigger.getBoundingClientRect();
    const left = Math.min(Math.max(12, rect.right - width), window.innerWidth - width - 12);
    let top = direction === "up" ? rect.top - height - 8 : rect.bottom + 8;
    top = Math.min(Math.max(12, top), window.innerHeight - height - 12);
    return { position: "fixed", top: `${top}px`, left: `${left}px`, width: `${width}px`, zIndex: 260 };
  }

  function togglePinned(conversationId) {
    setPinnedList((prev) => {
      const next = new Set(Array.isArray(prev) ? prev : []);
      if (next.has(conversationId)) next.delete(conversationId);
      else next.add(conversationId);
      return Array.from(next);
    });
    setMenuFor("");
  }

  function archiveChat(conversationId) {
    setArchivedList((prev) => {
      const next = new Set(Array.isArray(prev) ? prev : []);
      next.add(conversationId);
      return Array.from(next);
    });
    notify(chatText.archiveSuccess || "Chat archived.", "success");
    setMenuFor("");
  }

  function startRename(conversationId, title) {
    setRenameModal({ open: true, id: conversationId, value: title });
    setMenuFor("");
  }

  function saveRename() {
    const value = renameModal.value.trim();
    if (!value) return;
    setTitleOverrides((prev) => ({ ...(prev || {}), [renameModal.id]: value }));
    notify(chatText.renameSuccess || "Chat title updated.", "success");
    setRenameModal({ open: false, id: "", value: "" });
  }

  function ensureFolder(nameRaw) {
    const name = String(nameRaw || "").trim();
    if (!name) return "";
    const existing = folders.find((f) => f.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;
    const id = createFolderId();
    setFoldersState([...folders, { id, name }]);
    notify(chatText.folderCreated || "Project created.", "success");
    return id;
  }

  function openMoveModal(conversationId, title) {
    setMoveModal({
      open: true,
      id: conversationId,
      title,
      folderId: folderMapState?.[conversationId] || "",
      newFolderName: "",
    });
    setMenuFor("");
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
      notify(chatText.folderRemoved || "Chat removed from project.");
    } else {
      setFolderMapState((prev) => ({ ...(prev || {}), [convoId]: folderId }));
      notify(chatText.movedToFolder || "Chat moved to project.", "success");
    }
    setMoveModal({ open: false, id: "", title: "", folderId: "", newFolderName: "" });
  }

  const modalRoot = typeof document !== "undefined" ? document.body : null;

  return (
    <div className="folder-board-wrap" ref={rootRef}>
      <div className="folder-board-head">
        <h2>{folder?.name || (chatText.projectChats || chatText.folderChats || "Project chats")}</h2>
      </div>

      <div className="folder-board-grid">
        {chats.map((chat) => {
          const isActive = activeId === chat.conversation_id;
          return (
            <div
              key={chat.conversation_id}
              className={isActive ? "folder-board-card is-active" : "folder-board-card"}
              role="button"
              tabIndex={0}
              onClick={() => onOpenChat?.(chat.conversation_id)}
            >
              <div className="folder-board-card-head">
                <div className="folder-board-card-title">{chat._title}</div>
                <div className="folder-board-card-actions">
                  {pinned.has(chat.conversation_id) ? (
                    <span className="folder-board-pin" title={chatText.pinChat || "Pinned"}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 4v4l3 3v2H7v-2l3-3V4h4Z" />
                        <path d="M12 13v7" />
                      </svg>
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className="folder-board-menu-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextOpen = menuFor !== chat.conversation_id;
                      if (nextOpen) {
                        const direction = resolveMenuDirection(e.currentTarget, 220);
                        setMenuDirection(direction);
                        setMenuFor(chat.conversation_id);
                        setMenuPos(calcMenuPosition(e.currentTarget, direction, 210, 220));
                      } else {
                        setMenuFor("");
                      }
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
              <div className="folder-board-card-time">{fmt(chat.last_time)}</div>

              {menuFor === chat.conversation_id && menuPos && modalRoot ? createPortal(
                <div className="workspace-popover folder-board-menu" style={menuPos} ref={menuRef}>
                  <MenuItem
                    label={chatText.share || "Share"}
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 12 16 7M8 12l8 5" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="7" r="2" /><circle cx="18" cy="17" r="2" /></svg>}
                    onClick={() => {
                      doShare(chat.conversation_id, chat._title);
                      setMenuFor("");
                    }}
                  />
                  <MenuItem
                    label={chatText.open || "Open"}
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v1" /><path d="M6 12h12v7H6z" /></svg>}
                    onClick={() => {
                      onOpenChat?.(chat.conversation_id);
                      setMenuFor("");
                    }}
                  />
                  <MenuItem
                    label={chatText.rename || "Rename"}
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="m16.5 3.5 4 4L8 20l-4 1 1-4Z" /></svg>}
                    onClick={() => startRename(chat.conversation_id, chat._title)}
                  />
                  <MenuItem
                    label={chatText.moveToFolder || "Move to Project"}
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /><path d="m9 12 3 3 3-3" /></svg>}
                    onClick={() => openMoveModal(chat.conversation_id, chat._title)}
                  />
                  <MenuItem
                    label={chatText.removeFromFolder || "Remove from Project"}
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2" /><path d="M9 14h12" /><path d="M18 11l3 3-3 3" /></svg>}
                    onClick={() => {
                      setFolderMapState((prev) => {
                        const next = { ...(prev || {}) };
                        delete next[chat.conversation_id];
                        return next;
                      });
                      notify(chatText.folderRemoved || "Removed from project.", "success");
                      setMenuFor("");
                    }}
                  />
                  <MenuItem
                    label={pinned.has(chat.conversation_id) ? (chatText.unpinChat || "Unpin Chat") : (chatText.pinChat || "Pin Chat")}
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 4v4l3 3v2H7v-2l3-3V4h4Z" /><path d="M12 13v7" /></svg>}
                    onClick={() => togglePinned(chat.conversation_id)}
                  />
                  <MenuItem
                    label={chatText.archive || "Archive"}
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h18v3H3z" /><path d="M5 10v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" /><path d="M10 14h4" /></svg>}
                    onClick={() => {
                      archiveChat(chat.conversation_id);
                      setMenuFor("");
                    }}
                  />
                  <MenuItem
                    label={chatText.delete || "Delete"}
                    danger
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></svg>}
                    onClick={() => setDeleteModal({ open: true, id: chat.conversation_id, title: chat._title })}
                  />
                </div>,
                modalRoot
              ) : null}
            </div>
          );
        })}
      </div>

      {renameModal.open ? (
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
        </div>
      ) : null}

      {moveModal.open ? (
        <div className="workspace-modal-backdrop">
          <div className="workspace-modal-card">
            <h3>{chatText.moveToFolderTitle || "Move to project"}</h3>
            <p>{moveModal.title}</p>
            <select
              className="settings-field"
              value={moveModal.folderId}
              onChange={(e) => setMoveModal((prev) => ({ ...prev, folderId: e.target.value }))}
            >
              <option value="">{chatText.noFolderOption || "No project"}</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
              <option value="__new__">{chatText.createNewFolderOption || "Create a new project..."}</option>
            </select>
            {(moveModal.folderId === "__new__" || moveModal.newFolderName.trim()) ? (
              <input
                className="settings-field"
                value={moveModal.newFolderName}
                onChange={(e) => setMoveModal((prev) => ({ ...prev, newFolderName: e.target.value }))}
                placeholder={chatText.folderNamePlaceholder || "Project name"}
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
        </div>
      ) : null}

      {deleteModal.open ? (
        <div className="workspace-modal-backdrop">
          <div className="workspace-modal-card">
            <h3>{chatText.deleteConfirmTitle || "Delete chat?"}</h3>
            <p>{deleteModal.title}</p>
            <div className="workspace-modal-actions">
              <button className="workspace-modal-btn" onClick={() => setDeleteModal({ open: false, id: "", title: "" })}>{chatText.cancel || "Cancel"}</button>
              <button
                className="workspace-modal-btn is-danger"
                onClick={async () => {
                  await onDeleteChat?.(deleteModal.id);
                  setDeleteModal({ open: false, id: "", title: "" });
                }}
              >
                {chatText.delete || "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
