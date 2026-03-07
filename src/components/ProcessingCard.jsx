import React from "react";
import { APP_MESSAGES } from "../config/appConfig.js";

function Step({ i, title, detail }) {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-elev)] p-3">
      <div className="text-xs font-bold">{i}. {title}</div>
      <div className="mt-1 whitespace-pre-wrap text-xs text-[var(--text-secondary)]">{detail}</div>
    </div>
  );
}

function buildSummary(debug) {
  const run = debug?.run_log || {};
  const req = debug?.request || run?.request || {};
  const plan = debug?.plan || run?.plan || {};
  const search = debug?.search || run?.search || {};
  const result = run?.result || debug?.result || {};
  const decision = run?.decision || debug?.decision || {};
  const query = plan?.search_query || req?.message || "";
  const docType = plan?.doc_type || "unknown";
  const candidates = Number(search?.candidates || 0);
  const chosen = result?.best_file?.relpath || result?.best_file?.filename || "";
  const mode = decision?.mode || "decider";
  if (!query && !candidates && !chosen) return "";
  return [
    `I split the request into intent planning and retrieval. The planner detected doc_type=${docType} and built query: "${query}".`,
    `Search scanned your indexed files and found ${candidates} candidate${candidates === 1 ? "" : "s"} after ranking and filtering.`,
    chosen
      ? `Final selection used ${mode} mode and chose: ${chosen}.`
      : "No confident file was selected in this run.",
  ].join("\n\n");
}

export default function ProcessingCard({ steps, confidence, debug, copy }) {
  const text = copy?.workspace?.drawers || APP_MESSAGES.en.workspace.drawers;
  const summary = buildSummary(debug);
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold">{text.processing || "Processing"}</div>
        <div className="text-xs text-[var(--text-secondary)]">
          {text.confidence || "Confidence"}: <span className="font-mono">{confidence == null ? "—" : confidence.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {steps?.length ? steps.map((s, idx) => (
          <Step key={idx} i={idx+1} title={s.title} detail={s.detail} />
        )) : <div className="text-xs text-[var(--text-muted)]">{text.noSteps || "No steps yet."}</div>}
      </div>

      {summary ? (
        <div className="mt-4 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-elev)] p-3">
          <div className="text-xs font-bold">Analysis summary</div>
          <div className="mt-1 whitespace-pre-wrap text-xs text-[var(--text-secondary)]">{summary}</div>
        </div>
      ) : null}

      {debug ? (
        <>
          <div className="mt-4 text-xs font-bold">{text.details || "Details"}</div>
          <details className="mt-2 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-overlay)] p-3">
            <summary className="cursor-pointer text-xs text-[var(--text-secondary)]">Open raw run log JSON</summary>
            <pre className="mt-2 max-h-64 overflow-auto text-[11px] text-[var(--text-secondary)]">
{JSON.stringify(debug, null, 2)}
            </pre>
          </details>
        </>
      ) : null}
    </div>
  );
}
