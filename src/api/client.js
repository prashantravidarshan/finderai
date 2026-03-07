const API = "http://127.0.0.1:8000";

export function apiBase() {
  return API;
}

export async function apiJson(path, { method="GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.detail || data?.error?.message || "Request failed";
    throw new Error(msg);
  }
  return data;
}

export async function apiUploadFiles(path, { token, files, onProgress } = {}) {
  const form = new FormData();
  for (const f of files) {
    form.append("files", f, f.webkitRelativePath || f.name);
  }

  if (typeof onProgress === "function") {
    const url = API + path;
    const xhr = new XMLHttpRequest();

    const p = new Promise((resolve, reject) => {
      xhr.open("POST", url, true);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (evt) => {
        if (!evt.lengthComputable) return;
        const pct = Math.round((evt.loaded / evt.total) * 100);
        onProgress({ loaded: evt.loaded, total: evt.total, pct });
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText || "{}");
          if (xhr.status >= 200 && xhr.status < 300) resolve(data);
          else reject(new Error(data?.detail || "Upload failed"));
        } catch (e) {
          reject(new Error("Upload failed"));
        }
      };

      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(form);
    });

    return await p;
  }

  const res = await fetch(API + path, {
    method: "POST",
    headers: token ? { "Authorization": `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.detail || "Upload failed";
    throw new Error(msg);
  }
  return data;
}

export async function apiDownloadBlob(path, { token } = {}) {
  const res = await fetch(API + path, {
    method: "GET",
    headers: token ? { "Authorization": `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data?.detail || "Download failed";
    throw new Error(msg);
  }
  const blob = await res.blob();
  const cd = res.headers.get("content-disposition") || "";
  let filename = null;
  const m = cd.match(/filename="?([^"]+)"?/i);
  if (m) filename = m[1];
  return { blob, filename };
}
