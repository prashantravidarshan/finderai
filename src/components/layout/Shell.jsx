import React from "react";

export default function Shell({ header, sidebar, main, sidebarWidth = 412 }) {
  const hasSidebar = Boolean(sidebar);
  const layoutStyle = hasSidebar ? { gridTemplateColumns: `${Math.max(64, Number(sidebarWidth) || 412)}px minmax(0, 1fr)` } : undefined;
  return (
    <div className="workspace-shell min-h-screen text-[var(--text-primary)]">
      <div
        className={hasSidebar ? "min-h-screen lg:grid lg:h-screen" : "min-h-screen"}
        style={layoutStyle}
      >
        {hasSidebar ? (
          <aside className="workspace-sidebar border-b border-[var(--border-color)] lg:h-screen lg:border-b-0 lg:border-r">
            {sidebar}
          </aside>
        ) : null}

        <section className="workspace-main min-w-0 lg:flex lg:h-screen lg:flex-col">
          {header ? (
            <div className="workspace-header border-b border-[var(--border-color)] px-3 py-3 lg:px-6">
              {header}
            </div>
          ) : null}
          <div className="min-h-[360px] px-0 py-0 lg:min-h-0 lg:flex-1">{main}</div>
        </section>
      </div>
    </div>
  );
}
