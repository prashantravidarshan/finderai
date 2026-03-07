import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { clsx } from "../../utils/format.js";
import { APP_MESSAGES } from "../../config/appConfig.js";

function timeLabel(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

const REACTIONS = ["👍", "👎", "🙂", "😔", "😮"];

export default function MessageBubble({
  role,
  children,
  ts,
  footer,
  copy,
  onNotify,
  onRetry,
  onReply,
  onEdit,
  onReact,
  reaction,
  messageId,
  messageIndex,
}) {
  const chatText = copy?.chat || APP_MESSAGES.en.chat;
  const isUser = role === "user";
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [pinned, setPinned] = useState(false);
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPos, setMenuPos] = useState(null);
  const safeText = useMemo(
    () => (typeof children === "string" ? children : String(children ?? "")),
    [children]
  );

  useEffect(() => {
    function onDown(event) {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target)) return;
      if (menuRef.current?.contains(event.target)) return;
      setMenuOpen(false);
      setShowReactions(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  async function copyMessage() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(safeText);
      }
      onNotify?.(chatText.copied || "Message copied.", "success");
    } catch {
      onNotify?.(chatText.copyFailed || "Unable to copy message.", "warning");
    } finally {
      setMenuOpen(false);
      setShowReactions(false);
    }
  }

  function tryAgain() {
    onRetry?.(safeText);
    onNotify?.(chatText.retryStarted || "Retry started.", "info");
    setMenuOpen(false);
    setShowReactions(false);
  }

  function editMessage() {
    onEdit?.(messageIndex, safeText);
    setMenuOpen(false);
    setShowReactions(false);
  }

  function togglePin() {
    setPinned((prev) => !prev);
    onNotify?.(
      !pinned ? (chatText.messagePinned || "Message pinned.") : (chatText.messageUnpinned || "Message unpinned."),
      "info"
    );
    setMenuOpen(false);
    setShowReactions(false);
  }

  function readWithAudio() {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      onNotify?.(chatText.audioNotSupported || "Audio is not supported on this device.", "warning");
      return;
    }
    const utter = new SpeechSynthesisUtterance(safeText);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    onNotify?.(chatText.readingStarted || "Reading started.", "info");
    setMenuOpen(false);
    setShowReactions(false);
  }

  function replyToMessage() {
    onReply?.(safeText);
    onNotify?.(chatText.replyReady || "Reply draft added.", "info");
    setMenuOpen(false);
    setShowReactions(false);
  }

  function react(emoji) {
    onReact?.(messageId, emoji);
    onNotify?.(`${chatText.reacted || "Reacted"} ${emoji}`, "success");
    setMenuOpen(false);
    setShowReactions(false);
  }

  function calcMenuPosition(trigger, width = 190, height = 240) {
    if (!trigger || typeof window === "undefined") return null;
    const rect = trigger.getBoundingClientRect();
    const isBottom = rect.bottom + height + 12 > window.innerHeight;
    const top = isBottom ? rect.top - height - 8 : rect.bottom + 8;
    const left = Math.min(Math.max(12, rect.right - width), window.innerWidth - width - 12);
    return { position: "fixed", top: `${Math.max(12, top)}px`, left: `${left}px`, width: `${width}px`, zIndex: 260 };
  }

  const modalRoot = typeof document !== "undefined" ? document.body : null;

  return (
    <div className={clsx("flex", isUser ? "justify-end" : "justify-start")} ref={rootRef}>
      <div
        className={clsx(
          "message-bubble max-w-[min(76ch,88%)] px-4 py-3 text-sm leading-relaxed shadow-soft border",
          isUser ? "bubble-user" : "bubble-assistant",
          pinned ? "is-pinned" : ""
        )}
      >
        <p className="message-bubble-line">
          <span className="message-bubble-text">{children}</span>
          {ts ? <span className="message-bubble-time">{timeLabel(ts)}</span> : null}
          <button
            type="button"
            className={clsx("message-actions-trigger", menuOpen ? "is-open" : "")}
            onClick={(e) => {
              const next = !menuOpen;
              setMenuOpen(next);
              if (next) {
                setMenuPos(calcMenuPosition(e.currentTarget));
                setShowReactions(false);
              }
            }}
            title={chatText.messageMenu || "Message actions"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </p>

        {menuOpen && modalRoot ? createPortal(
          <div
            ref={menuRef}
            className={clsx(
              "workspace-popover message-actions-menu",
              isUser ? "is-user" : "is-assistant"
            )}
            style={menuPos || undefined}
          >
            <button type="button" className="workspace-menu-item" onClick={copyMessage}>
              <span className="workspace-menu-item-label">
                <span className="workspace-menu-item-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="11" height="11" rx="2" /><rect x="4" y="4" width="11" height="11" rx="2" /></svg>
                </span>
                <span>{chatText.copy || "Copy"}</span>
              </span>
            </button>
            {isUser ? (
              <button type="button" className="workspace-menu-item" onClick={editMessage}>
                <span className="workspace-menu-item-label">
                  <span className="workspace-menu-item-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="m16.5 3.5 4 4L8 20l-4 1 1-4Z" /></svg>
                  </span>
                  <span>{chatText.edit || "Edit"}</span>
                </span>
              </button>
            ) : (
              <button type="button" className="workspace-menu-item" onClick={tryAgain}>
                <span className="workspace-menu-item-label">
                  <span className="workspace-menu-item-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 3v6h6" /></svg>
                  </span>
                  <span>{chatText.tryAgain || "Try again"}</span>
                </span>
              </button>
            )}
            <button type="button" className="workspace-menu-item" onClick={togglePin}>
              <span className="workspace-menu-item-label">
                <span className="workspace-menu-item-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 4v4l3 3v2H7v-2l3-3V4h4Z" /><path d="M12 13v7" /></svg>
                </span>
                <span>{pinned ? (chatText.unpin || "Unpin") : (chatText.pin || "Pin")}</span>
              </span>
            </button>
            <button type="button" className="workspace-menu-item" onClick={readWithAudio}>
              <span className="workspace-menu-item-label">
                <span className="workspace-menu-item-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /></svg>
                </span>
                <span>{chatText.readWithAudio || "Read with audio"}</span>
              </span>
            </button>
            <button type="button" className="workspace-menu-item" onClick={replyToMessage}>
              <span className="workspace-menu-item-label">
                <span className="workspace-menu-item-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 14-5-5 5-5" /><path d="M4 9h9a7 7 0 0 1 7 7v3" /></svg>
                </span>
                <span>{chatText.reply || "Reply"}</span>
              </span>
            </button>
            <button
              type="button"
              className="workspace-menu-item"
              onClick={() => setShowReactions((v) => !v)}
            >
              <span className="workspace-menu-item-label">
                <span className="workspace-menu-item-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 10h.01M15 10h.01" /></svg>
                </span>
                <span>{chatText.react || "React"}</span>
              </span>
              <span className="workspace-menu-arrow">▸</span>
            </button>
            {showReactions ? (
              <div className="message-reaction-row">
                {REACTIONS.map((emoji) => (
                  <button key={emoji} type="button" className="message-reaction-btn" onClick={() => react(emoji)}>
                    {emoji}
                  </button>
                ))}
              </div>
            ) : null}
          </div>,
          modalRoot
        ) : null}

        {reaction ? <span className="message-reaction-pill">{reaction}</span> : null}

        {footer ? <div className="mt-3">{footer}</div> : null}
      </div>
    </div>
  );
}
