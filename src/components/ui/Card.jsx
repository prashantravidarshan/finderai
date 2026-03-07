import React from "react";
import { clsx } from "../../utils/format.js";

export default function Card({ className="", children }) {
  return (
    <div className={clsx("rounded-3xl ui-card", className)}>
      {children}
    </div>
  );
}
