import React, { useState } from "react";
import Modal from "./overlay/Modal.jsx";
import Input from "./ui/Input.jsx";
import Button from "./ui/Button.jsx";
import { APP_MESSAGES } from "../config/appConfig.js";

export default function ConnectFolderModal({ open, onClose, onConnect, onBrowse, loading, copy }) {
  const text = copy?.workspace?.connectModal || APP_MESSAGES.en.workspace.connectModal;
  const [path, setPath] = useState("");

  async function submit() {
    const p = path.trim();
    if (!p) return;
    await onConnect(p);
    setPath("");
    onClose();
  }

  async function browse() {
    if (!onBrowse) return;
    const selected = await onBrowse();
    if (selected) setPath(selected);
  }

  return (
    <Modal open={open} title={text.title || "Connect local folder"} onClose={onClose}>
      <div className="text-xs text-[var(--text-muted)]">
        {text.hint || "Choose a folder once. It will be indexed and kept in sync in real-time."}
      </div>
      <div className="mt-3 space-y-3">
        <Input placeholder={text.placeholder || "/Users/you/Documents/KYC"} value={path} onChange={(e) => setPath(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={browse}>{text.browse || "Browse..."}</Button>
          <Button variant="secondary" onClick={onClose}>{text.cancel || "Cancel"}</Button>
          <Button onClick={submit} disabled={loading}>{loading ? (text.connecting || "Connecting...") : (text.connect || "Connect")}</Button>
        </div>
      </div>
    </Modal>
  );
}
