import { useCallback, useEffect, useState } from "react";

function normalizePath(path) {
  if (!path || path === "") return "/";
  if (!path.startsWith("/")) return `/${path}`;
  return path;
}

export function usePathRouter() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    function onPopState() {
      setPath(normalizePath(window.location.pathname));
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((nextPath, opts = {}) => {
    const target = normalizePath(nextPath);
    const replace = Boolean(opts.replace);
    if (window.location.pathname !== target) {
      if (replace) window.history.replaceState({}, "", target);
      else window.history.pushState({}, "", target);
    }
    setPath(target);
  }, []);

  return { path, navigate };
}

