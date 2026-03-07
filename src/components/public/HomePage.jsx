import React from "react";
import { APP_MESSAGES } from "../../config/appConfig.js";

export default function HomePage({ onGoLogin, onGoDashboard, token, copy }) {
  const hero = copy?.home || APP_MESSAGES.en.home;
  const valueChips = Array.isArray(hero.valueChips) && hero.valueChips.length
    ? hero.valueChips
    : ["Intent-aware retrieval", "Local + remote connectors", "Content-level search", "Extract + generate + deliver"];
  const manualFlow = Array.isArray(hero.manualFlow) && hero.manualFlow.length
    ? hero.manualFlow
    : ["Open multiple locations", "Try keyword and filename guesses", "Review files one by one", "Manually compile and send"];
  const agentFlow = Array.isArray(hero.agentFlow) && hero.agentFlow.length
    ? hero.agentFlow
    : [
      "User request captured",
      "Intent mapped",
      "Connected sources scanned",
      "Evidence verified",
      "Draft + attachments prepared",
      "Delivery-ready output",
    ];
  const queryExamples = Array.isArray(hero.queryExamples) && hero.queryExamples.length
    ? hero.queryExamples
    : [
      "Find all references to vendor renewal terms from last year and summarize obligations.",
      "Locate trip photos with mountain sunrise and prepare a share-ready folder.",
      "Pull policy clauses related to data retention and draft a comparison note.",
    ];
  const manualTime = hero.manualTime || "Manual: 2-3 hours";
  const agentTime = hero.agentTime || "With Fyndoy: under 20 seconds";
  const storyLabel = hero.storyLabel || "Why users switch";
  const pipelineLabel = hero.pipelineLabel || "How Fyndoy agent works";
  const capabilities = Array.isArray(hero.capabilityBlocks) && hero.capabilityBlocks.length
    ? hero.capabilityBlocks
    : [
      { title: "Intent Reasoning", desc: "Understands what user really wants, not just exact words." },
      { title: "Unified Retrieval", desc: "Fetches from connected sources in one pass, local and remote." },
      { title: "Content Intelligence", desc: "Finds by meaning inside files, images, and mixed formats." },
    ];
  const intelligenceStrip = Array.isArray(hero.intelligenceStrip) && hero.intelligenceStrip.length
    ? hero.intelligenceStrip
    : ["Intent first", "Content-level search", "Improve weak inputs", "Draft with attachments", "Ready to send"];
  const playgroundSteps = Array.isArray(hero.playgroundSteps) && hero.playgroundSteps.length
    ? hero.playgroundSteps
    : ["Understand intent", "Search and verify", "Extract and improve", "Draft and deliver"];
  const playgroundActions = Array.isArray(hero.playgroundActions) && hero.playgroundActions.length
    ? hero.playgroundActions
    : ["Summary ready", "Attachments selected", "Message draft ready", "Delivery prepared"];
  const playgroundQuery = hero.playgroundQuery || "Find latest vendor policy deltas, fix unreadable scan text, and prepare a client update.";
  const playgroundResult = hero.playgroundResult || "Verified results collected from connected knowledge sources with improved readability and structured highlights.";
  const playgroundDraft = hero.playgroundDraft || "Draft prepared with concise summary and referenced attachments.";
  const proofStats = Array.isArray(hero.proofStats) && hero.proofStats.length
    ? hero.proofStats
    : [
      { label: "Search effort reduction", value: "90%+" },
      { label: "Average retrieval time", value: "<20s" },
      { label: "Output readiness", value: "End-to-end" },
      { label: "Reasoning depth", value: "Multi-step" },
    ];
  const promisePoints = Array.isArray(hero.promisePoints) && hero.promisePoints.length
    ? hero.promisePoints
    : [
      "Interprets user intent before retrieval.",
      "Collects evidence from connected work sources.",
      "Understands content semantics inside files and images.",
      "Improves weak inputs and extracts structured details.",
      "Prepares message drafts with relevant attachments.",
      "Delivers execution-ready outputs for immediate sharing.",
    ];
  const systemFlow = Array.isArray(hero.systemFlow) && hero.systemFlow.length
    ? hero.systemFlow
    : [
      { title: "Intent parse", detail: "Context + goal detection" },
      { title: "Unified retrieval", detail: "Connected source scan" },
      { title: "Semantic ranking", detail: "Meaning-first matching" },
      { title: "Detail extraction", detail: "Structured evidence build" },
      { title: "Generation layer", detail: "Draft + attachment prep" },
      { title: "Delivery step", detail: "Ready-to-send output" },
    ];
  const systemFlowLive = Array.isArray(hero.systemFlowLive) && hero.systemFlowLive.length
    ? hero.systemFlowLive
    : ["Intent mapped", "Sources scanned", "Confidence scored", "Evidence compiled", "Draft assembled", "Delivery ready"];
  const footerGroups = Array.isArray(hero.footerGroups) && hero.footerGroups.length
    ? hero.footerGroups
    : [
      { title: "Product", links: ["Capabilities", "Playground", "Workflow", "Use Cases"] },
      { title: "Company", links: ["About", "Contact", "Support", "Status"] },
      { title: "Trust", links: ["Security", "Privacy", "Compliance", "Terms"] },
      { title: "Resources", links: ["Docs", "Release Notes", "Guides", "API"] },
    ];

  return (
    <main className="home-premium-main">
      <section className="home-premium-stage">
        <div className="home-premium-mesh" aria-hidden="true" />
        <div className="home-premium-glow" aria-hidden="true" />
        <div className="home-premium-spark home-premium-spark-a" aria-hidden="true" />
        <div className="home-premium-spark home-premium-spark-b" aria-hidden="true" />
        <div className="home-premium-ring home-premium-ring-a" aria-hidden="true" />
        <div className="home-premium-ring home-premium-ring-b" aria-hidden="true" />

        <div className="home-premium-copy">
          <div className="home-premium-eyebrow">{hero.eyebrow}</div>
          <h1>
            {hero.titleMain}
            <span className="home-premium-accent">{hero.titleAccent}</span>
          </h1>
          <p>
            <span>{hero.subtitleA}</span>
            <span>{hero.subtitleB}</span>
          </p>

          <div className="home-premium-story-label">{storyLabel}</div>

          <div className="home-premium-chip-row">
            {valueChips.map((item) => (
              <span key={item} className="home-premium-chip">{item}</span>
            ))}
          </div>

          <div className="home-premium-query-ticker" aria-label="Example queries">
            <span className="home-query-ticker-label">User asks</span>
            <div className="home-query-ticker-window">
              <div className="home-query-ticker-track">
                {[...queryExamples, ...queryExamples].map((query, idx) => (
                  <p key={`${query}-${idx}`}>{query}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="home-premium-pipeline-label">{pipelineLabel}</div>

          <div className="home-premium-flowboard" aria-label="Manual vs Fyndoy flow">
            <div className="home-flow-lane home-flow-lane-manual">
              <div className="home-flow-head">
                <strong>Manual Search</strong>
                <span>Fragmented, slow, and repetitive</span>
              </div>
              <div className="home-flow-track home-flow-track-manual" aria-hidden="true">
                <span className="home-flow-progress home-flow-progress-manual" />
              </div>
              <div className="home-flow-steps">
                {manualFlow.map((step, index) => (
                  <div key={step} className="home-flow-step">
                    <span className="home-flow-step-index">{index + 1}</span>
                    <span className="home-flow-step-label">{step}</span>
                  </div>
                ))}
              </div>
              <div className="home-flow-time home-flow-time-manual">{manualTime}</div>
            </div>

            <div className="home-flow-core" aria-hidden="true">
              <span className="home-flow-core-node">Intent</span>
              <span className="home-flow-core-node">Search</span>
              <span className="home-flow-core-node">Extract</span>
              <span className="home-flow-core-node">Deliver</span>
              <span className="home-flow-core-stream" />
            </div>

            <div className="home-flow-lane home-flow-lane-agent">
              <div className="home-flow-head">
                <strong>Fyndoy Agent Flow</strong>
                <span>Understands, retrieves, composes, and sends</span>
              </div>
              <div className="home-flow-track home-flow-track-agent" aria-hidden="true">
                <span className="home-flow-progress home-flow-progress-agent" />
              </div>
              <div className="home-flow-steps">
                {agentFlow.map((step, index) => (
                  <div key={step} className="home-flow-step">
                    <span className="home-flow-step-index home-flow-step-index-agent">{index + 1}</span>
                    <span className="home-flow-step-label">{step}</span>
                    <span className="home-flow-step-progress home-flow-step-progress-agent" aria-hidden="true" />
                  </div>
                ))}
              </div>
              <div className="home-flow-time home-flow-time-agent">{agentTime}</div>
            </div>
          </div>

          <div className="home-premium-illus home-premium-illus-floating" aria-hidden="true">
            <span className="home-illus-orb home-illus-orb-a" />
            <span className="home-illus-orb home-illus-orb-b" />
            <span className="home-illus-cube" />
            <span className="home-illus-cone" />
            <span className="home-illus-pulse" />
          </div>

          <div className="home-premium-actions">
            <button className="home-premium-cta" onClick={token ? onGoDashboard : onGoLogin}>
              {token ? hero.dashboardCta : hero.cta}
            </button>
          </div>
        </div>
      </section>

      <section className="home-intelligence-section">
        <div className="home-intelligence-head">
          <span>{hero.intelligenceLabel || "Why this agent"}</span>
          <h2>{hero.intelligenceTitle || "Built to reason, retrieve, and execute end-to-end."}</h2>
          <p>{hero.intelligenceSubtitle || "From fuzzy requests to delivery-ready outputs, Fyndoy combines retrieval quality with action automation."}</p>
        </div>
        <div className="home-intelligence-grid">
          {capabilities.map((item) => (
            <article key={item.title} className="home-intelligence-item">
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
        <div className="home-intelligence-strip">
          {intelligenceStrip.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="home-playground-section">
        <div className="home-playground-head">
          <span>{hero.playgroundLabel || "Interactive playground"}</span>
          <h2>{hero.playgroundTitle || "See the workflow: message to result in seconds."}</h2>
          <p>{hero.playgroundSubtitle || "Live-style preview of how the app understands requests, gathers evidence, and prepares final output."}</p>
        </div>

        <div className="home-playground-stage" aria-label="Workflow playground">
          <div className="home-playground-chat">
            <div className="home-playground-bubble home-playground-bubble-user">
              <strong>User request</strong>
              <p>{playgroundQuery}</p>
            </div>
            <div className="home-playground-bubble home-playground-bubble-agent">
              <strong>Agent response</strong>
              <p>{playgroundResult}</p>
            </div>
            <div className="home-playground-bubble home-playground-bubble-draft">
              <strong>Prepared action</strong>
              <p>{playgroundDraft}</p>
            </div>
          </div>

          <div className="home-playground-flow">
            <div className="home-playground-track" aria-hidden="true">
              <span className="home-playground-pulse" />
            </div>
            <div className="home-playground-steps">
              {playgroundSteps.map((step, index) => (
                <div key={step} className="home-playground-step">
                  <span>{index + 1}</span>
                  <small>{step}</small>
                </div>
              ))}
            </div>
            <div className="home-playground-actions">
              {playgroundActions.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>

        </div>

        <div className="home-playground-visual home-playground-visual-floating" aria-hidden="true">
          <span className="home-play-orb home-play-orb-a" />
          <span className="home-play-orb home-play-orb-b" />
          <span className="home-play-prism" />
          <span className="home-play-ring" />
        </div>
      </section>

      <section className="home-proof-section">
        <div className="home-proof-head">
          <span>{hero.proofLabel || "Operational proof"}</span>
          <h2>{hero.proofTitle || "Built for real execution, not just search results."}</h2>
          <p>{hero.proofSubtitle || "Every run is optimized to reduce manual effort and produce decision-ready output quickly."}</p>
        </div>
        <div className="home-proof-grid">
          {proofStats.map((item) => (
            <div key={item.label} className="home-proof-item">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="home-system-section">
        <div className="home-system-copy">
          <span>{hero.systemLabel || "System flow"}</span>
          <h2>{hero.systemTitle || "How the agent moves from request to final delivery."}</h2>
          <p>{hero.systemSubtitle || "One continuous reasoning pipeline designed for retrieval quality, output quality, and action speed."}</p>
          <ul>
            {promisePoints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="home-system-diagram" aria-label="Agent system flow diagram">
          <div className="home-system-rail" aria-hidden="true">
            <span className="home-system-signal" />
          </div>
          <div className="home-system-steps">
            {systemFlow.map((step, index) => (
              <article key={step.title} className="home-system-step">
                <span className="home-system-index">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
                <div className="home-system-step-live">
                  <span className="home-system-trace" aria-hidden="true" />
                  <small>{systemFlowLive[index] || "In progress"}</small>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-footer-grid">
          {footerGroups.map((group) => (
            <div key={group.title} className="home-footer-col">
              <h4>{group.title}</h4>
              {group.links.map((item) => (
                <button key={item} type="button">{item}</button>
              ))}
            </div>
          ))}
        </div>
      </footer>
    </main>
  );
}
