export function formatBytes(bytes) {
  if (bytes == null) return "—";
  const units = ["B","KB","MB","GB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  const digits = i === 0 ? 0 : 1;
  return `${v.toFixed(digits)} ${units[i]}`;
}

export function clsx(...xs) {
  return xs.filter(Boolean).join(" ");
}
