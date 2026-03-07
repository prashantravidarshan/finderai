import React from "react";
import { clsx } from "../../utils/format.js";
import { APP_MESSAGES } from "../../config/appConfig.js";

export default function FlashNotices({ notices = [], onDismiss, copy }) {
  if (!notices.length) return null;
  const closeLabel =
    copy?.public?.close ||
    copy?.settings?.common?.cancel ||
    APP_MESSAGES.en.public.close ||
    "Close";

  return (
    <div className="flash-notice-stack" role="status" aria-live="polite">
      {notices.map((notice) => (
        <div
          key={notice.id}
          className={clsx(
            "flash-notice-item",
            notice.type === "success" && "is-success",
            notice.type === "warning" && "is-warning",
            notice.type === "error" && "is-error"
          )}
        >
          <div className="flash-notice-message">{notice.message}</div>
          <button
            type="button"
            className="flash-notice-close"
            onClick={() => onDismiss?.(notice.id)}
            aria-label={closeLabel}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
