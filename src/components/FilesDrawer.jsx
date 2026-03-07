import React, { useMemo } from "react";
import Select from "./ui/Select.jsx";
import { APP_MESSAGES } from "../config/appConfig.js";

export default function FilesDrawer({ files, filter, setFilter, copy }) {
  const text = copy?.workspace?.drawers || APP_MESSAGES.en.workspace.drawers;
  const filtered = useMemo(() => {
    const list = files || [];
    if (filter === "all") return list;
    return list.filter(f => {
      const m = (f.mime || "").toLowerCase();
      const name = (f.filename || "").toLowerCase();
      if (filter === "pdf") return m.includes("pdf") || name.endsWith(".pdf");
      if (filter === "image") return m.startsWith("image/") || name.match(/\.(png|jpg|jpeg|webp|bmp|tiff)$/);
      if (filter === "text") return m.startsWith("text/") || m.includes("json") || name.match(/\.(txt|md|json|csv|log)$/);
      if (filter === "doc") return m.includes("word") || name.endsWith(".docx");
      if (filter === "xls") return m.includes("sheet") || name.endsWith(".xlsx");
      return true;
    });
  }, [files, filter]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold">{text.yourFiles || "Your uploaded files"}</div>
        <div className="w-40">
          <Select value={filter} onChange={(e)=>setFilter(e.target.value)}>
            <option value="all">{text.filterAll || "All"}</option>
            <option value="pdf">{text.filterPdf || "PDF"}</option>
            <option value="image">{text.filterImages || "Images"}</option>
            <option value="text">{text.filterText || "Text"}</option>
            <option value="doc">{text.filterDocx || "DOCX"}</option>
            <option value="xls">{text.filterXlsx || "XLSX"}</option>
          </Select>
        </div>
      </div>

      <div className="mt-3 max-h-[70vh] overflow-auto rounded-2xl border border-[var(--border-color)] bg-[var(--surface-overlay)] p-3 space-y-1">
        {filtered.length ? filtered.slice(0, 800).map(f => (
          <div key={f.id} className="text-[11px] font-mono text-[var(--text-secondary)]">
            {f.relpath || f.filename}
          </div>
        )) : (
          <div className="text-sm text-[var(--text-muted)]">{text.noFiles || "No files uploaded."}</div>
        )}
      </div>
    </div>
  );
}
