import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble.jsx";
import { clsx } from "../../utils/format.js";
import { APP_MESSAGES } from "../../config/appConfig.js";

export default function ChatThread({
  messages,
  className = "",
  copy,
  onNotify,
  onRetryMessage,
  onReplyMessage,
  onEditMessage,
  onReactMessage,
  reactionMap,
}) {
  const chatText = copy?.chat || APP_MESSAGES.en.chat;
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={ref}
      className={clsx(
        "chat-thread-pane min-h-[300px] overflow-auto space-y-3 rounded-none border-0 border-t border-[var(--border-color)] bg-[var(--surface-overlay)] p-4 lg:min-h-0 lg:flex-1",
        className
      )}
    >
      {messages?.length ? (
        messages.map((m, idx) => (
          <MessageBubble
            key={m._id || `${m.ts || "ts"}-${m.role || "role"}-${idx}`}
            messageId={m._id || `${m.ts || "ts"}-${m.role || "role"}-${idx}`}
            messageIndex={idx}
            role={m.role}
            ts={m.ts}
            footer={m.footer}
            copy={copy}
            onNotify={onNotify}
            onRetry={onRetryMessage}
            onReply={onReplyMessage}
            onEdit={onEditMessage}
            onReact={onReactMessage}
            reaction={reactionMap?.[m._id || `${m.ts || "ts"}-${m.role || "role"}-${idx}`] || ""}
          >
            {m.content}
          </MessageBubble>
        ))
      ) : (
        <div className="text-sm text-[var(--text-muted)]">
          {chatText.emptyHint || "Ask for any document by name, type, or details."}
        </div>
      )}
    </div>
  );
}
