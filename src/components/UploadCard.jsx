import React from "react";
import Card from "./ui/Card.jsx";
import Button from "./ui/Button.jsx";

export default function UploadCard({ selectedFiles, onPick, onUpload, uploading, onRefresh, status }) {
  const count = selectedFiles?.length || 0;
  const canUpload = count > 0 && !uploading;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold tracking-wide">1) Folder permission & upload</div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onRefresh}>Refresh</Button>
          <Button onClick={onUpload} disabled={!canUpload}>{uploading ? "Uploading…" : `Upload (${count})`}</Button>
        </div>
      </div>

      {status ? <div className="mt-2 text-xs text-white/70">{status}</div> : null}

      <div className="mt-3">
        <input
          className="block w-full text-sm text-white/70 file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-white/20"
          type="file"
          webkitdirectory="true"
          directory="true"
          multiple
          onChange={onPick}
        />
        <div className="mt-2 text-xs text-white/50">
          Browser security: system can only search the folder you selected here.
        </div>
      </div>
    </Card>
  );
}
