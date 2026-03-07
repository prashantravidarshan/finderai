import React, { useState } from "react";
import Card from "./ui/Card.jsx";
import Button from "./ui/Button.jsx";
import { formatBytes } from "../utils/format.js";
import { useFilePreview } from "../hooks/useFilePreview.js";

export default function FilePanel({
  token,
  bestFile,
  candidates,
  onPickCandidate,
  onDownload,
}) {
  const fileId = bestFile?.id;
  const mime = bestFile?.mime || "";
  const { url, text, loading, error } = useFilePreview({ token, fileId, mime });

  const [showRelated, setShowRelated] = useState(true);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold tracking-wide">Preview</div>
          <Button variant="secondary" onClick={() => fileId && onDownload(fileId)} disabled={!fileId}>
            Download
          </Button>
        </div>

        {!bestFile ? (
          <div className="mt-3 text-sm text-white/50">
            No document selected yet.
          </div>
        ) : (
          <div className="mt-3 space-y-1 text-xs text-white/70">
            <div><span className="text-white/50">Path:</span> <span className="font-mono">{bestFile.relpath || bestFile.filename}</span></div>
            <div><span className="text-white/50">Size:</span> {formatBytes(bestFile.size_bytes)}</div>
            <div><span className="text-white/50">MIME:</span> <span className="font-mono">{bestFile.mime || "—"}</span></div>
            <div><span className="text-white/50">Score:</span> <span className="font-mono">{bestFile.best_score ?? "—"}</span></div>
          </div>
        )}

        <div className="mt-4 h-[520px] overflow-hidden rounded-3xl border border-white/10 bg-black/20">
          {loading ? (
            <div className="p-4 text-sm text-white/60">Loading preview…</div>
          ) : error ? (
            <div className="p-4 text-sm text-red-300">{error}</div>
          ) : text ? (
            <pre className="h-full overflow-auto p-4 text-[12px] leading-relaxed text-white/75">{text}</pre>
          ) : url ? (
            mime.toLowerCase().includes("pdf") ? (
              <iframe title="preview" src={url} className="h-full w-full" />
            ) : (
              <img alt="preview" src={url} className="h-full w-full object-contain" />
            )
          ) : (
            <div className="p-4 text-sm text-white/50">No preview.</div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold tracking-wide">Related</div>
          <button className="text-xs text-white/60 hover:text-white" onClick={() => setShowRelated(v => !v)}>
            {showRelated ? "Hide" : "Show"}
          </button>
        </div>

        {showRelated ? (
          <div className="mt-3 space-y-2">
            {(candidates || []).length ? candidates.slice(0, 8).map((c, idx) => (
              <button
                key={idx}
                onClick={() => onPickCandidate(c)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10"
              >
                <div className="text-xs font-semibold font-mono">{c.relpath || c.filename}</div>
                <div className="mt-1 text-[11px] text-white/60">
                  score <span className="font-mono">{c.score}</span> · <span className="font-mono">{c.why}</span>
                </div>
              </button>
            )) : <div className="text-sm text-white/50">No related docs.</div>}
          </div>
        ) : (
          <div className="mt-3 text-sm text-white/50">Hidden.</div>
        )}
      </Card>
    </div>
  );
}
