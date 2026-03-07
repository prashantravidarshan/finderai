import { useCallback, useEffect, useState } from "react";

export function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? initial : JSON.parse(raw);
    } catch {
      return initial;
    }
  });

  const setStoredValue = useCallback((next) => {
    setVal((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
        window.dispatchEvent(new CustomEvent("fyndoy-local-storage", {
          detail: { key, value: resolved },
        }));
      } catch {
        // ignore
      }
      return resolved;
    });
  }, [key]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== key) return;
      try {
        setVal(event.newValue == null ? initial : JSON.parse(event.newValue));
      } catch {
        setVal(initial);
      }
    };

    const onSameTabStorage = (event) => {
      if (event?.detail?.key !== key) return;
      setVal(event.detail.value);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("fyndoy-local-storage", onSameTabStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("fyndoy-local-storage", onSameTabStorage);
    };
  }, [initial, key]);

  return [val, setStoredValue];
}
