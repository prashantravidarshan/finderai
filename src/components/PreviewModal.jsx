import React from "react";
import Modal from "./overlay/Modal.jsx";
import { useFilePreview } from "../hooks/useFilePreview.js";
import { APP_MESSAGES } from "../config/appConfig.js";

export default function PreviewModal({ open, onClose, token, file, onDownload, copy }) {
  const labels = copy?.workspace?.preview || APP_MESSAGES.en.workspace.preview;
  const fileId = file?.id;
  const mime = file?.mime || "";
  const { url, text, loading, error } = useFilePreview({ token, fileId, mime });

  return (
    <Modal open={open} title={file?.relpath || file?.filename || labels.title || "Preview"} onClose={onClose}>
      <div className="flex items-center justify-end gap-2 mb-3">
        {fileId ? (
          <button
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border border-[var(--border-color)] bg-[var(--surface-elev)] hover:bg-[var(--surface-hover)]"
            onClick={() => onDownload?.(fileId)}
          >
            {labels.download || "Download"}
          </button>
        ) : null}
      </div>

      <div className="h-[70vh] min-h-[420px] overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--surface-overlay)]">
        {loading ? (
          <div className="p-4 text-sm text-[var(--text-muted)]">{labels.loading || "Loading..."}</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-400">{error}</div>
        ) : text ? (
          <pre className="h-full overflow-auto p-4 text-[12px] leading-relaxed text-[var(--text-secondary)]">{text}</pre>
        ) : url ? (
          mime.toLowerCase().includes("pdf") ? (
            <iframe title="preview" src={url} className="h-full w-full" />
          ) : (
            <img alt="preview" src={url} className="h-full w-full object-contain" />
          )
        ) : (
          <div className="p-4 text-sm text-[var(--text-muted)]">{labels.noPreview || "No preview."}</div>
        )}
      </div>
    </Modal>
  );
}
