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
    : ["Understand user intent", "Search local and remote sources", "Extract exact details from content", "Generate and deliver final output"];
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
                    <span className="home-flow-step-index">{index + 1}</span>
                    <span className="home-flow-step-label">{step}</span>
                  </div>
                ))}
              </div>
              <div className="home-flow-time home-flow-time-agent">{agentTime}</div>
            </div>

            <div className="home-premium-illus" aria-hidden="true">
              <span className="home-illus-orb home-illus-orb-a" />
              <span className="home-illus-orb home-illus-orb-b" />
              <span className="home-illus-cube" />
              <span className="home-illus-cone" />
              <span className="home-illus-pulse" />
            </div>
          </div>

          <div className="home-premium-actions">
            <button className="home-premium-cta" onClick={token ? onGoDashboard : onGoLogin}>
              {token ? hero.dashboardCta : hero.cta}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
