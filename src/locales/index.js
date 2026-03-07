import EN from "./en.js";
import DE from "./de.js";
import HI from "./hi.js";

function mergeDeep(base, patch) {
  if (!patch) return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = mergeDeep(base[key] && typeof base[key] === "object" ? base[key] : {}, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

const PATCH_BY_CODE = {
  de: DE,
  hi: HI,
};

export function buildAppMessages(localeCodes = []) {
  const out = { en: EN };
  const codes = new Set(["en", ...(localeCodes || [])]);
  for (const code of codes) {
    if (code === "en") continue;
    out[code] = mergeDeep(EN, PATCH_BY_CODE[code] || {});
  }
  return out;
}

export { EN };
