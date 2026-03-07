import React from "react";
import { APP_MESSAGES } from "../../config/appConfig.js";

export default function HomePage({ onGoLogin, onGoDashboard, token, copy }) {
  const hero = copy?.home || APP_MESSAGES.en.home;
  return (
    <main className="home-premium-main">
      <section className="home-premium-stage">
        <div className="home-premium-glow" aria-hidden="true" />
        <div className="home-premium-spark home-premium-spark-a" aria-hidden="true" />
        <div className="home-premium-spark home-premium-spark-b" aria-hidden="true" />

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
