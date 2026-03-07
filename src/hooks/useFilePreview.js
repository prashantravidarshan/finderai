import { useEffect, useState } from "react";
import { apiDownloadBlob } from "../api/client.js";

export function useFilePreview({ token, fileId, mime }) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let revokeUrl = null;

    async function run() {
      setError("");
      setUrl("");
      setText("");
      if (!fileId || !token) return;

      setLoading(true);
      try {
        const m = (mime || "").toLowerCase();
        const isText = m.startsWith("text/") || m.includes("json");
        if (isText) {
          const res = await fetch(`http://127.0.0.1:8000/api/files/${fileId}/preview_text?max_chars=12000`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const t = await res.text();
          setText(t);
        } else {
          const { blob } = await apiDownloadBlob(`/api/files/${fileId}/download`, { token });
          const u = URL.createObjectURL(blob);
          revokeUrl = u;
          setUrl(u);
        }
      } catch (e) {
        setError(e.message || "Preview failed");
      } finally {
        setLoading(false);
      }
    }

    run();
    return () => {
      if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    };
  }, [token, fileId, mime]);

  return { url, text, loading, error };
}
