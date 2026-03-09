import React, { useEffect, useRef, useState } from "react";
import { clsx } from "../../utils/format.js";
import { APP_MESSAGES } from "../../config/appConfig.js";

export default function UploadMenu({ onPickFolder, onPickFiles, onConnectLocal, embedded = false, copy }) {
  const chatText = copy?.chat || APP_MESSAGES.en.chat;
  const [open, setOpen] = useState(false);
  const folderRef = useRef(null);
  const fileRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    function onDown(event) {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function pickFolder() {
    setOpen(false);
    folderRef.current?.click();
  }

  function pickFiles() {
    setOpen(false);
    fileRef.current?.click();
  }

  function connectLocal() {
    setOpen(false);
    onConnectLocal?.();
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "chat-upload-trigger flex items-center justify-center border border-[var(--border-color)] bg-[var(--surface-elev)] hover:bg-[var(--surface-hover)]",
          embedded ? "h-10 w-10 rounded-xl text-base" : "h-10 w-10 rounded-2xl text-lg"
        )}
        title={chatText.attach || "Attach / Connect"}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <input
        ref={folderRef}
        type="file"
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
        onChange={onPickFolder}
      />
      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={onPickFiles}
      />

      {open ? (
        <div
          className={clsx(
            "absolute z-20 w-64 border border-[var(--border-color)] bg-[var(--surface-solid)] shadow-soft p-2",
            embedded ? "bottom-10 left-0 rounded-xl" : "bottom-12 left-0 rounded-2xl"
          )}
        >
          <button className="w-full text-left rounded-xl px-3 py-2 text-sm hover:bg-[var(--surface-hover)]" onClick={pickFolder}>
            {chatText.uploadFolders || "Upload folders"}
          </button>
          <button className="mt-1 w-full text-left rounded-xl px-3 py-2 text-sm hover:bg-[var(--surface-hover)]" onClick={pickFiles}>
            {chatText.uploadFiles || "Upload files"}
          </button>
          <button className="mt-1 w-full text-left rounded-xl px-3 py-2 text-sm hover:bg-[var(--surface-hover)]" onClick={connectLocal}>
            {chatText.connectLiveFolder || "Link live folder"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
