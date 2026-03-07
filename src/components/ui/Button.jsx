import React from "react";
import { clsx } from "../../utils/format.js";

export default function Button({ variant="primary", className="", ...props }) {
  const base = "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    primary: "ui-btn-primary",
    secondary: "ui-btn-secondary",
    ghost: "ui-btn-ghost",
    danger: "ui-btn-danger",
  };
  return <button className={clsx(base, styles[variant] || styles.primary, className)} {...props} />;
}
