import React, { useEffect, useRef, useState } from "react";
import Shell from "./components/layout/Shell.jsx";
import SidebarChats from "./components/SidebarChats.jsx";
import Drawer from "./components/overlay/Drawer.jsx";
import RunHistory from "./components/RunHistory.jsx";

import ChatThread from "./components/chat/ChatThread.jsx";
import ChatComposer from "./components/chat/ChatComposer.jsx";
import FolderBoard from "./components/chat/FolderBoard.jsx";
import PreviewModal from "./components/PreviewModal.jsx";
import ProcessingCard from "./components/ProcessingCard.jsx";

import PublicLayout from "./components/public/PublicLayout.jsx";
import HomePage from "./components/public/HomePage.jsx";
import LoginPage from "./components/public/LoginPage.jsx";
import SignupPage from "./components/public/SignupPage.jsx";
import ForgotPasswordPage from "./components/public/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./components/public/ResetPasswordPage.jsx";
import SettingsPage from "./components/dashboard/SettingsPage.jsx";
import IndexFilesPage from "./components/dashboard/IndexFilesPage.jsx";

import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { usePathRouter } from "./hooks/usePathRouter.js";
import { apiJson, apiUploadFiles, apiDownloadBlob } from "./api/client.js";
import FlashNotices from "./components/ui/FlashNotices.jsx";
import {
  APP_AUTO_LOCK_OPTIONS,
  APP_CACHE_MODES,
  APP_COLOR_THEMES,
  APP_FILE_TYPE_OPTIONS,
  APP_FONT_SIZES,
  APP_FONT_PRESETS,
  APP_LOCALES,
  APP_MESSAGES,
  APP_NOTIFICATION_OPTIONS,
  APP_PUBLIC_MENU_GROUPS,
  APP_SEARCH_MODES,
  APP_THEME_MODES,
  DEFAULT_CACHE_MODE,
  DEFAULT_COLOR_THEME,
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_PRESET,
  DEFAULT_LOCALE,
  DEFAULT_SEARCH_MODE,
  DEFAULT_THEME_MODE,
  RTL_LOCALES,
} from "./config/appConfig.js";

function nowIso() { return new Date().toISOString(); }

function formatDuration(ms) {
  if (ms == null) return "";
  const s = Math.max(0, Math.round(ms / 100) / 10);
  return s >= 60 ? `${Math.floor(s/60)}m ${Math.round(s%60)}s` : `${s}s`;
}

function interpolate(template, params = {}) {
  if (!template || typeof template !== "string") return "";
  return template.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ""));
}

const PUBLIC_AUTH_ROUTES = new Set(["/login", "/signup", "/forgot-password", "/reset-password"]);
const PRIVATE_ROUTES = new Set(["/dashboard", "/settings", "/index", "/files"]);
const THEME_MODES = new Set(APP_THEME_MODES.map((item) => item.id));
const LOCALE_CODES = new Set(APP_LOCALES.map((item) => item.code));
const FONT_SIZE_IDS = new Set(APP_FONT_SIZES.map((item) => item.id));
const SEARCH_MODE_IDS = new Set(APP_SEARCH_MODES.map((item) => item.id));
const CACHE_MODE_IDS = new Set(APP_CACHE_MODES.map((item) => item.id));
const AUTO_LOCK_IDS = new Set(APP_AUTO_LOCK_OPTIONS.map((item) => item.id));

function defaultEnabledMap(items) {
  return items.reduce((acc, item) => {
    acc[item.id] = true;
    return acc;
  }, {});
}

function parseLocalePath(pathname) {
  const normalized = pathname || "/";
  const parts = normalized.split("/").filter(Boolean);
  if (!parts.length) return { locale: null, route: "/" };
  const first = parts[0].toLowerCase();
  if (!LOCALE_CODES.has(first)) {
    return { locale: null, route: normalized };
  }
  const rest = parts.slice(1);
  return { locale: first, route: rest.length ? `/${rest.join("/")}` : "/" };
}

function withLocale(routePath, locale) {
  const normalized = !routePath ? "/" : routePath.startsWith("/") ? routePath : `/${routePath}`;
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}

function hexToRgba(hex, alpha) {
  const value = hex.replace("#", "").trim();
  if (value.length !== 6) return `rgba(22, 196, 170, ${alpha})`;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function App() {
  const [token, setToken] = useLocalStorage("calenox_token", "");
  const [conversationId, setConversationId] = useLocalStorage("calenox_conversation_id", null);
  const [messages, setMessages] = useLocalStorage("calenox_messages", []);
  const [thinkingMode, setThinkingMode] = useLocalStorage("calenox_thinking", "fast");
  const [chatModel, setChatModel] = useLocalStorage("fyndoy_chat_model", "auto");
  const [themePreference, setThemePreference] = useLocalStorage("fyndoy_theme_pref", DEFAULT_THEME_MODE);
  const [colorTheme, setColorTheme] = useLocalStorage("fyndoy_color_theme", DEFAULT_COLOR_THEME);
  const [fontPreset, setFontPreset] = useLocalStorage("fyndoy_font_preset", DEFAULT_FONT_PRESET);
  const [fontSize, setFontSize] = useLocalStorage("fyndoy_font_size", DEFAULT_FONT_SIZE);
  const [localePref, setLocalePref] = useLocalStorage("fyndoy_locale", DEFAULT_LOCALE);
  const [searchMode, setSearchMode] = useLocalStorage("fyndoy_search_mode", DEFAULT_SEARCH_MODE);
  const [cacheMode, setCacheMode] = useLocalStorage("fyndoy_cache_mode", DEFAULT_CACHE_MODE);
  const [fileTypePrefs, setFileTypePrefs] = useLocalStorage("fyndoy_file_types", defaultEnabledMap(APP_FILE_TYPE_OPTIONS));
  const [notificationPrefs, setNotificationPrefs] = useLocalStorage("fyndoy_notifications", defaultEnabledMap(APP_NOTIFICATION_OPTIONS));
  const [autoLock, setAutoLock] = useLocalStorage("fyndoy_auto_lock", "off");
  const [systemTheme, setSystemTheme] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const [status, setStatus] = useState("");
  const [notices, setNotices] = useState([]);
  const [authError, setAuthError] = useState("");
  const [messageReactions, setMessageReactions] = useState({});
  const [chatFolders, setChatFolders] = useLocalStorage("fyndoy_chat_folders", []);
  const [chatFolderMap, setChatFolderMap] = useLocalStorage("fyndoy_chat_folder_map", {});
  const [pendingFolderId, setPendingFolderId] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [fileList, setFileList] = useState([]);

  const [conversations, setConversations] = useState([]);
  const [processingDrawerOpen, setProcessingDrawerOpen] = useState(false);
  const [analysisTab, setAnalysisTab] = useState("flow");
  const [indexStatus, setIndexStatus] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [draftSeed, setDraftSeed] = useState(null);
  const [pendingEditIndex, setPendingEditIndex] = useState(null);
  const [folderPanel, setFolderPanel] = useState(null);

  const { path, navigate } = usePathRouter();
  const pathInfo = parseLocalePath(path || "/");
  const route = pathInfo.route || "/";
  const activeLocalePref = LOCALE_CODES.has(localePref) ? localePref : DEFAULT_LOCALE;
  const activeLocale = pathInfo.locale || activeLocalePref;
  const activeThemePreference = THEME_MODES.has(themePreference) ? themePreference : "system";
  const resolvedTheme = activeThemePreference === "system" ? systemTheme : activeThemePreference;
  const activeColorTheme = APP_COLOR_THEMES.find((item) => item.id === colorTheme) || APP_COLOR_THEMES[0];
  const activeFontPreset = APP_FONT_PRESETS.find((item) => item.id === fontPreset) || APP_FONT_PRESETS[0];
  const activeFontSize = APP_FONT_SIZES.find((item) => item.id === fontSize) || APP_FONT_SIZES[1];
  const activeSearchMode = SEARCH_MODE_IDS.has(searchMode) ? searchMode : DEFAULT_SEARCH_MODE;
  const activeCacheMode = CACHE_MODE_IDS.has(cacheMode) ? cacheMode : DEFAULT_CACHE_MODE;
  const activeAutoLock = AUTO_LOCK_IDS.has(autoLock) ? autoLock : "off";
  const copy = APP_MESSAGES[activeLocale] || APP_MESSAGES.en;

  const lastProcessingRef = useRef({ steps: [], debug: null, confidence: null, latency_ms: null });
  const noticeTimersRef = useRef(new Map());
  const lastStatusNoticeRef = useRef("");
  const pageTitleRef = useRef(typeof document !== "undefined" ? document.title : "Fyndoy");

  function shouldIgnoreErrorMessage(msg) {
    if (!msg) return false;
    const s = String(msg).toLowerCase();
    return s.includes("invalid token") || s.includes("not authenticated") || s.includes("failed to fetch") || s.includes("request failed");
  }

  function bumpUnread(conversationId) {
    if (!conversationId) return;
    setUnreadCounts((prev) => ({ ...(prev || {}), [conversationId]: Number(prev?.[conversationId] || 0) + 1 }));
  }

  function clearUnread(conversationId) {
    if (!conversationId) return;
    setUnreadCounts((prev) => {
      if (!prev?.[conversationId]) return prev;
      const next = { ...(prev || {}) };
      delete next[conversationId];
      return next;
    });
  }

  function dismissNotice(id) {
    setNotices((prev) => prev.filter((item) => item.id !== id));
    const t = noticeTimersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      noticeTimersRef.current.delete(id);
    }
  }

  function pushNotice(message, type = "info", timeoutMs = 2200) {
    if (!message) return;
    const id = `notice_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setNotices((prev) => [...prev, { id, message, type }].slice(-6));
    const timer = setTimeout(() => dismissNotice(id), timeoutMs);
    noticeTimersRef.current.set(id, timer);
  }

  useEffect(() => {
    if (!pathInfo.locale) {
      navigate(withLocale(route, activeLocalePref), { replace: true });
      return;
    }
    if (pathInfo.locale !== localePref) {
      setLocalePref(pathInfo.locale);
    }
  }, [activeLocalePref, localePref, navigate, pathInfo.locale, route, setLocalePref]);

  useEffect(() => {
    return () => {
      for (const timer of noticeTimersRef.current.values()) clearTimeout(timer);
      noticeTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const next = String(status || "").trim();
    if (!next) return;
    if (next === lastStatusNoticeRef.current) return;
    lastStatusNoticeRef.current = next;
    pushNotice(next, next.toLowerCase().includes("error") ? "error" : "info");
  }, [status]);

  useEffect(() => {
    const total = Object.values(unreadCounts || {}).reduce((acc, v) => acc + Number(v || 0), 0);
    const base = pageTitleRef.current || "Fyndoy";
    if (typeof document !== "undefined") {
      document.title = total > 0 ? `(${total}) ${base}` : base;
    }
  }, [unreadCounts]);

  useEffect(() => {
    function onVisibility() {
      if (!document.hidden) {
        clearUnread(conversationId);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [conversationId]);

  useEffect(() => {
    if (token && PUBLIC_AUTH_ROUTES.has(route)) {
      navigate(withLocale("/dashboard", activeLocale), { replace: true });
      return;
    }
    if (!token && PRIVATE_ROUTES.has(route)) {
      navigate(withLocale("/login", activeLocale), { replace: true });
    }
  }, [token, route, navigate, activeLocale]);

  useEffect(() => {
    setAuthError("");
  }, [route]);

  useEffect(() => {
    if (!THEME_MODES.has(themePreference)) {
      setThemePreference(DEFAULT_THEME_MODE);
    }
  }, [setThemePreference, themePreference]);

  useEffect(() => {
    if (!APP_COLOR_THEMES.some((item) => item.id === colorTheme)) {
      setColorTheme(DEFAULT_COLOR_THEME);
    }
  }, [colorTheme, setColorTheme]);

  useEffect(() => {
    if (!APP_FONT_PRESETS.some((item) => item.id === fontPreset)) {
      setFontPreset(DEFAULT_FONT_PRESET);
    }
  }, [fontPreset, setFontPreset]);

  useEffect(() => {
    if (!FONT_SIZE_IDS.has(fontSize)) {
      setFontSize(DEFAULT_FONT_SIZE);
    }
  }, [fontSize, setFontSize]);

  useEffect(() => {
    if (!SEARCH_MODE_IDS.has(searchMode)) {
      setSearchMode(DEFAULT_SEARCH_MODE);
    }
  }, [searchMode, setSearchMode]);

  useEffect(() => {
    if (!CACHE_MODE_IDS.has(cacheMode)) {
      setCacheMode(DEFAULT_CACHE_MODE);
    }
  }, [cacheMode, setCacheMode]);

  useEffect(() => {
    if (!AUTO_LOCK_IDS.has(autoLock)) {
      setAutoLock("off");
    }
  }, [autoLock, setAutoLock]);

  useEffect(() => {
    if (!token) return;
    if (activeAutoLock === "off") return;
    const option = APP_AUTO_LOCK_OPTIONS.find((item) => item.id === activeAutoLock);
    const minutes = option?.minutes || 0;
    if (!minutes) return;
    let timer = null;

    function resetTimer() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        logout();
      }, minutes * 60 * 1000);
    }

    const events = ["mousemove", "keydown", "mousedown", "scroll", "touchstart"];
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [token, activeAutoLock]);

  useEffect(() => {
    if (!LOCALE_CODES.has(localePref)) {
      setLocalePref(DEFAULT_LOCALE);
    }
  }, [localePref, setLocalePref]);

  useEffect(() => {
    const normalized = defaultEnabledMap(APP_FILE_TYPE_OPTIONS);
    let changed = false;
    for (const key of Object.keys(normalized)) {
      if (typeof fileTypePrefs?.[key] !== "boolean") {
        changed = true;
      } else {
        normalized[key] = fileTypePrefs[key];
      }
    }
    if (changed) setFileTypePrefs(normalized);
  }, [fileTypePrefs, setFileTypePrefs]);

  useEffect(() => {
    const normalized = defaultEnabledMap(APP_NOTIFICATION_OPTIONS);
    let changed = false;
    for (const key of Object.keys(normalized)) {
      if (typeof notificationPrefs?.[key] !== "boolean") {
        changed = true;
      } else {
        normalized[key] = notificationPrefs[key];
      }
    }
    if (changed) setNotificationPrefs(normalized);
  }, [notificationPrefs, setNotificationPrefs]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (evt) => setSystemTheme(evt.matches ? "dark" : "light");
    if (typeof mql.addEventListener === "function") mql.addEventListener("change", onChange);
    else if (typeof mql.addListener === "function") mql.addListener(onChange);
    return () => {
      if (typeof mql.removeEventListener === "function") mql.removeEventListener("change", onChange);
      else if (typeof mql.removeListener === "function") mql.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    const active = resolvedTheme === "light" ? "light" : "dark";
    const root = document.documentElement;
    root.setAttribute("data-theme", active);
    root.style.colorScheme = active;
    root.style.setProperty("--accent", activeColorTheme.accent);
    root.style.setProperty("--accent-strong", activeColorTheme.accentStrong);
    root.style.setProperty(
      "--accent-soft",
      hexToRgba(activeColorTheme.accent, active === "light" ? 0.13 : 0.17)
    );
    root.style.setProperty("--font-body", activeFontPreset.body);
    root.style.setProperty("--font-display", activeFontPreset.display);
    root.style.setProperty("--font-scale", String(activeFontSize.scale || 1));
    root.style.fontSize = `${16 * (activeFontSize.scale || 1)}px`;
    root.setAttribute("lang", activeLocale);
    root.setAttribute("dir", RTL_LOCALES.has(activeLocale) ? "rtl" : "ltr");
  }, [resolvedTheme, activeColorTheme, activeFontPreset, activeFontSize, activeLocale]);

  function navigateRoute(nextPath, opts = {}) {
    navigate(withLocale(nextPath, activeLocale), opts);
  }

  function setThemeMode(mode) {
    if (!THEME_MODES.has(mode)) return;
    setThemePreference(mode);
  }

  function setColorMode(mode) {
    if (!APP_COLOR_THEMES.some((item) => item.id === mode)) return;
    setColorTheme(mode);
  }

  function setFontMode(mode) {
    if (!APP_FONT_PRESETS.some((item) => item.id === mode)) return;
    setFontPreset(mode);
  }

  function setFontSizeMode(mode) {
    if (!FONT_SIZE_IDS.has(mode)) return;
    setFontSize(mode);
  }

  function setSearchModePref(mode) {
    if (!SEARCH_MODE_IDS.has(mode)) return;
    setSearchMode(mode);
  }

  function setCacheModePref(mode) {
    if (!CACHE_MODE_IDS.has(mode)) return;
    setCacheMode(mode);
  }

  function toggleFileTypePref(kind) {
    if (!APP_FILE_TYPE_OPTIONS.some((item) => item.id === kind)) return;
    setFileTypePrefs((prev) => ({ ...prev, [kind]: !prev?.[kind] }));
  }

  function toggleNotificationPref(kind) {
    if (!APP_NOTIFICATION_OPTIONS.some((item) => item.id === kind)) return;
    setNotificationPrefs((prev) => ({ ...prev, [kind]: !prev?.[kind] }));
  }

  function setAutoLockPref(mode) {
    if (!AUTO_LOCK_IDS.has(mode)) return;
    setAutoLock(mode);
  }

  function setLocaleMode(nextLocale) {
    if (!LOCALE_CODES.has(nextLocale)) return;
    setLocalePref(nextLocale);
    navigate(withLocale(route, nextLocale), { replace: true });
  }

  async function login(payload) {
    try {
      const data = await apiJson("/api/auth/login", { method: "POST", body: payload });
      setToken(data.access_token);
      setAuthError("");
      navigateRoute("/dashboard", { replace: true });
      return data;
    } catch (e) {
      setAuthError(e.message);
      throw e;
    }
  }

  async function register(payload) {
    try {
      const data = await apiJson("/api/auth/register", { method: "POST", body: payload });
      setToken(data.access_token);
      setAuthError("");
      navigateRoute("/dashboard", { replace: true });
      return data;
    } catch (e) {
      setAuthError(e.message);
      throw e;
    }
  }

  async function requestOtp(payload) {
    try {
      const data = await apiJson("/api/auth/forgot-password", { method: "POST", body: payload });
      setAuthError("");
      return data;
    } catch (e) {
      setAuthError(e.message);
      throw e;
    }
  }

  async function verifyOtp(payload) {
    try {
      const data = await apiJson("/api/auth/verify-otp", { method: "POST", body: payload });
      setAuthError("");
      return data;
    } catch (e) {
      setAuthError(e.message);
      throw e;
    }
  }

  async function resetPassword(payload) {
    try {
      const data = await apiJson("/api/auth/reset-password", { method: "POST", body: payload });
      setAuthError("");
      return data;
    } catch (e) {
      setAuthError(e.message);
      throw e;
    }
  }

  function logout() {
    setToken("");
    setConversationId(null);
    setMessages([]);
    setSelectedFiles([]);
    setFileList([]);
    setConversations([]);
    setIndexStatus(null);
    setStatus("");
    setNotices([]);
    setMessageReactions({});
    setUnreadCounts({});
    setAuthError("");
    navigateRoute("/", { replace: true });
  }

  function newChat(folderId = "") {
    setConversationId(null);
    setMessages([]);
    setFolderPanel(null);
    setPendingEditIndex(null);
    setStatus("");
    setPendingFolderId(folderId || "");
    if (route !== "/dashboard") navigateRoute("/dashboard");
  }

  function openFolderPanel(folder) {
    setFolderPanel(folder || null);
    setConversationId(null);
    setMessages([]);
  }

  async function refreshFileList() {
    if (!token) return;
    try {
      const data = await apiJson("/api/files/list", { token });
      setFileList(data.files || []);
    } catch (e) {
      setUploadProgress(null);
      if (!shouldIgnoreErrorMessage(e.message)) setStatus(e.message);
    }
  }

  async function refreshIndexStatus() {
    if (!token) return;
    try {
      const data = await apiJson("/api/index/status", { token });
      setIndexStatus(data);
    } catch {
      // ignore
    }
  }

  async function browseLocalFolder() {
    if (!token) return null;
    try {
      const data = await apiJson("/api/index/browse", { method: "POST", token, body: {} });
      return data.root_path || null;
    } catch (e) {
      const msg = e.message || "";
      if (!/cancel|user cancelled|folder selection cancelled|-\d+/.test(msg.toLowerCase())) {
        setUploadProgress(null);
        if (!shouldIgnoreErrorMessage(msg)) setStatus(msg);
      }
      return null;
    }
  }

  async function connectLocalFolder(rootPath) {
    if (!token) return;
    setConnecting(true);
    try {
      await apiJson("/api/index/connect", { method: "POST", token, body: { root_path: rootPath } });
      await refreshIndexStatus();
      await refreshFileList();
      const ws = copy?.workspace?.status || APP_MESSAGES.en.workspace.status;
      setStatus(ws.indexingStarted || "Sync started.");
    } catch (e) {
      setUploadProgress(null);
      if (!shouldIgnoreErrorMessage(e.message)) setStatus(e.message);
    } finally {
      setConnecting(false);
    }
  }

  async function refreshConversations() {
    if (!token) return;
    try {
      const data = await apiJson("/api/conversations", { token });
      setConversations(data.conversations || []);
    } catch {
      // ignore
    }
  }

  async function loadConversation(cid) {
    if (!token || !cid) return;
    try {
      const data = await apiJson(`/api/chats/${cid}`, { token });
      const msgs = (data.messages || []).map((m, idx) => ({
        role: m.role,
        content: m.content,
        ts: m.created_at ? new Date(m.created_at).toISOString() : nowIso(),
        _id: m.id != null ? `db_${m.id}` : `${cid}_${idx}_${m.created_at || nowIso()}`,
      }));
      setMessages(msgs);
      setConversationId(cid);
      setFolderPanel(null);
      setStatus("");
      clearUnread(cid);
      if (route !== "/dashboard") navigateRoute("/dashboard");
    } catch (e) {
      setUploadProgress(null);
      if (!shouldIgnoreErrorMessage(e.message)) setStatus(e.message);
    }
  }

  async function deleteConversation(cid) {
    if (!token || !cid) return;
    try {
      await apiJson(`/api/conversations/${cid}`, { method: "DELETE", token });
      if (conversationId === cid) newChat();
      await refreshConversations();
      clearUnread(cid);
    } catch (e) {
      setUploadProgress(null);
      if (!shouldIgnoreErrorMessage(e.message)) setStatus(e.message);
    }
  }

  useEffect(() => {
    if (!token) return;
    refreshFileList();
    refreshConversations();
    refreshIndexStatus();
    const t = setInterval(() => refreshIndexStatus(), 4000);
    return () => clearInterval(t);
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    const roots = Array.isArray(indexStatus?.roots) ? indexStatus.roots : [];
    const hasActiveSync = roots.some((root) => root?.in_progress);
    if (!hasActiveSync) return undefined;
    const t = setInterval(() => {
      refreshFileList();
      refreshConversations();
    }, 3200);
    return () => clearInterval(t);
  }, [token, indexStatus]);

  useEffect(() => {
    if (!folderPanel?.id) return;
    const folderId = folderPanel.id;
    const scoped = (conversations || [])
      .filter((c) => (chatFolderMap?.[c.conversation_id] || "") === folderId)
      .map((c) => ({
        conversation_id: c.conversation_id,
        title: c.title,
        last_time: c.last_time,
      }));
    setFolderPanel((prev) => {
      if (!prev || prev.id !== folderId) return prev;
      return { ...prev, chats: scoped };
    });
  }, [folderPanel?.id, conversations, chatFolderMap]);

  function onPickFolder(e) {
    const picked = Array.from(e.target.files || []);
    setSelectedFiles(picked);
    if (picked.length) {
      const ws = copy?.workspace?.status || APP_MESSAGES.en.workspace.status;
      const tpl = ws.selectedFiles || "Selected {count} files (will upload on send).";
      setStatus(interpolate(tpl, { count: picked.length }));
    }
  }

  function onPickFiles(e) {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    setSelectedFiles((prev) => [...(Array.isArray(prev) ? prev : []), ...picked]);
    const ws = copy?.workspace?.status || APP_MESSAGES.en.workspace.status;
    const tpl = ws.selectedFiles || "Selected {count} files (will upload on send).";
    setStatus(interpolate(tpl, { count: picked.length }));
  }

  async function handleConnectLiveFolder() {
    const selected = await browseLocalFolder();
    if (!selected) return;
    await connectLocalFolder(selected);
  }

  async function uploadSelectedIfAny() {
    if (!token || !selectedFiles.length) return;
    setUploading(true);
    try {
      setUploadProgress({ pct: 0 });
      const data = await apiUploadFiles("/api/files/upload", {
        token,
        files: selectedFiles,
        onProgress: (p) => setUploadProgress(p),
      });
      setSelectedFiles([]);
      const ws = copy?.workspace?.status || APP_MESSAGES.en.workspace.status;
      const tpl = ws.uploadedFiles || "Uploaded {count} files.";
      setStatus(interpolate(tpl, { count: data.uploaded }));
      setUploadProgress(null);
      await refreshFileList();
    } catch (e) {
      setUploadProgress(null);
      setStatus(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function sendMessage(text, options = {}) {
    if (!token) return;

    if (selectedFiles.length) {
      await uploadSelectedIfAny();
    }

    const conversationRef = options.conversationIdOverride ?? conversationId;
    const folderContextId = pendingFolderId || folderPanel?.id || "";
    const userMsg = { role: "user", content: text, ts: nowIso(), _id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
    const thinkingId = `thinking-${Date.now()}`;

    const tempConversationId = !conversationRef ? `tmp_${Date.now().toString(36)}` : "";
    if (tempConversationId) {
      setConversations((prev) => [
        {
          conversation_id: tempConversationId,
          title: text,
          last_time: nowIso(),
        },
        ...(Array.isArray(prev) ? prev : []).filter((c) => c?.conversation_id !== tempConversationId),
      ]);
      setConversationId(tempConversationId);
    }

    setMessages((m) => [
      ...m,
      userMsg,
      {
        role: "assistant",
        content: copy?.workspace?.status?.thinkingAnalyzing || APP_MESSAGES.en.workspace.status.thinkingAnalyzing || "Analyzing...",
        ts: nowIso(),
        _id: thinkingId,
        footer: (
          <button className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]" onClick={() => setProcessingDrawerOpen(true)}>
            {copy?.chat?.thinking || APP_MESSAGES.en.chat.thinking || "Thinking"}
          </button>
        ),
      },
    ]);

    try {
      const data = await apiJson("/api/agent/chat", {
        method: "POST",
        token,
        body: {
          message: text,
          conversation_id: conversationRef,
          thinking_mode: activeSearchMode === "strict" ? "deep" : thinkingMode,
          ...(chatModel && chatModel !== "auto" ? { model: chatModel } : {}),
        },
      });

      if (!conversationId) setConversationId(data.conversation_id);
      if (tempConversationId && data.conversation_id) {
        setConversations((prev) =>
          (Array.isArray(prev) ? prev : []).map((row) =>
            row?.conversation_id === tempConversationId
              ? { ...row, conversation_id: data.conversation_id, title: row.title || text, last_time: nowIso() }
              : row
          )
        );
        setConversationId(data.conversation_id);
      }
      if (!conversationId && folderContextId && data.conversation_id) {
        setChatFolderMap((prev) => ({ ...(prev || {}), [data.conversation_id]: folderContextId }));
        setPendingFolderId("");
      }

      lastProcessingRef.current = {
        steps: data.steps || [],
        debug: data.debug || null,
        confidence: data.confidence ?? null,
        latency_ms: data.latency_ms ?? null,
      };

      const footer = (
        <div className="flex items-center gap-3">
          <button className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]" onClick={() => setProcessingDrawerOpen(true)}>
            {data.latency_ms != null
              ? interpolate(copy?.workspace?.status?.thoughtFor || APP_MESSAGES.en.workspace.status.thoughtFor || "Thought for {duration}", { duration: formatDuration(data.latency_ms) })
              : (copy?.workspace?.status?.thought || APP_MESSAGES.en.workspace.status.thought || "Thought")}
          </button>
          {data.best_file?.id ? (
            <button
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl border border-[var(--border-color)] bg-[var(--surface-elev)] px-2 py-1"
              onClick={() => {
                setPreviewFile(data.best_file);
                setPreviewOpen(true);
              }}
              title={copy?.workspace?.status?.openPreview || APP_MESSAGES.en.workspace.status.openPreview || "Open preview"}
            >
              📎 {data.best_file.relpath || data.best_file.filename}
            </button>
          ) : null}
        </div>
      );

      setMessages((m) =>
        m.filter((x) => x._id !== thinkingId).concat([
          {
            role: "assistant",
            content: data.assistant_message || "",
            ts: nowIso(),
            footer,
            _id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          },
        ])
      );

      if (document.hidden) {
        bumpUnread(data.conversation_id || conversationRef);
      }

      await refreshConversations();
    } catch (e) {
      setUploadProgress(null);
      if (shouldIgnoreErrorMessage(e.message)) {
        if (String(e.message || "").toLowerCase().includes("invalid token") || String(e.message || "").toLowerCase().includes("not authenticated")) {
          logout();
        }
        return;
      }
      setMessages((m) =>
        m.filter((x) => x._id !== thinkingId).concat([
          {
            role: "assistant",
            content: `${copy?.workspace?.status?.errorPrefix || APP_MESSAGES.en.workspace.status.errorPrefix || "Error:"} ${e.message}`,
            ts: nowIso(),
            _id: `e_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            footer: (
              <button className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]" onClick={() => setProcessingDrawerOpen(true)}>
                {copy?.workspace?.status?.details || APP_MESSAGES.en.workspace.status.details || "Details"}
              </button>
            ),
          },
        ])
      );
    }
  }

  function onReplyMessage(text) {
    setDraftSeed({ id: Date.now(), text: `${text}\n` });
  }

  async function onRetryMessage(text) {
    const query = String(text || "").trim();
    if (!query) return;
    await sendMessage(query);
  }

  function onReactMessage(messageId, emoji) {
    if (!messageId) return;
    setMessageReactions((prev) => ({ ...(prev || {}), [messageId]: emoji }));
  }

  function onEditMessage(messageIndex, text) {
    const idx = Number(messageIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= messages.length) return;
    const target = messages[idx];
    if (!target || target.role !== "user") return;
    setPendingEditIndex(idx);
    setDraftSeed({ id: Date.now(), text: String(text || "") });
    pushNotice(copy?.chat?.editingNow || APP_MESSAGES.en.chat.editingNow || "Editing message. Update text and send.", "info");
  }

  async function handleComposerSend(text) {
    if (pendingEditIndex == null) {
      await sendMessage(text);
      return;
    }

    const idx = Number(pendingEditIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= messages.length) {
      setPendingEditIndex(null);
      await sendMessage(text);
      return;
    }

    const keptMessages = messages.slice(0, idx);
    setMessages(keptMessages);
    setPendingEditIndex(null);
    setDraftSeed(null);
    setMessageReactions((prev) => {
      const next = {};
      for (const msg of keptMessages) {
        if (msg?._id && prev?.[msg._id]) next[msg._id] = prev[msg._id];
      }
      return next;
    });

    try {
      if (conversationId) {
        await apiJson(`/api/chats/${conversationId}/truncate`, {
          method: "POST",
          token,
          body: { keep_count: idx },
        });
      }
      pushNotice(copy?.chat?.editApplied || APP_MESSAGES.en.chat.editApplied || "Message updated. Regenerating response...", "info");
      await sendMessage(text, { conversationIdOverride: conversationId || null });
    } catch (e) {
      setStatus(e.message);
      pushNotice(e.message, "error");
    }
  }

  async function downloadFile(fileId) {
    if (!token || !fileId) return;
    try {
      const { blob, filename } = await apiDownloadBlob(`/api/files/${fileId}/download`, { token });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `file_${fileId}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setUploadProgress(null);
      if (!shouldIgnoreErrorMessage(e.message)) setStatus(e.message);
    }
  }

  function go(pathname) {
    setAuthError("");
    navigateRoute(pathname);
  }

  if (!token) {
    let page = (
      <HomePage
        token={token}
        onGoLogin={() => go("/login")}
        onGoDashboard={() => go("/dashboard")}
        copy={copy}
      />
    );

    if (route === "/login") {
      page = (
        <LoginPage
          onLogin={login}
          onGoSignup={() => go("/signup")}
          onGoForgot={() => go("/forgot-password")}
          errorMessage={authError}
          copy={copy}
        />
      );
    } else if (route === "/signup") {
      page = <SignupPage onSignup={register} onGoLogin={() => go("/login")} errorMessage={authError} copy={copy} />;
    } else if (route === "/forgot-password") {
      page = (
        <ForgotPasswordPage
          onRequestOtp={requestOtp}
          onVerifyOtp={verifyOtp}
          onResetPassword={resetPassword}
          onGoLogin={() => go("/login")}
          errorMessage={authError}
          copy={copy}
        />
      );
    } else if (route === "/reset-password") {
      page = (
        <ResetPasswordPage
          onResetPassword={resetPassword}
          onGoForgot={() => go("/forgot-password")}
          onGoLogin={() => go("/login")}
          errorMessage={authError}
          copy={copy}
        />
      );
    }

    return (
      <PublicLayout
        onGoHome={() => go("/")}
        onGoLogin={() => go("/login")}
        onGoDashboard={() => go("/dashboard")}
        token={token}
        copy={copy}
        menuGroups={copy?.public?.menuGroups || APP_PUBLIC_MENU_GROUPS}
        themeMode={activeThemePreference}
        onThemeMode={setThemeMode}
        colorTheme={activeColorTheme.id}
        onColorTheme={setColorMode}
        colorThemes={APP_COLOR_THEMES}
        fontPreset={activeFontPreset.id}
        onFontPreset={setFontMode}
        fontPresets={APP_FONT_PRESETS}
        fontSize={activeFontSize.id}
        onFontSize={setFontSizeMode}
        fontSizes={APP_FONT_SIZES}
        locale={activeLocale}
        onLocale={setLocaleMode}
        locales={APP_LOCALES}
      >
        {page}
      </PublicLayout>
    );
  }

  const isSettingsRoute = route === "/settings";
  const isIndexRoute = route === "/index";
  const isFilesRoute = route === "/files";
  const compactSidebar = isSettingsRoute || isIndexRoute || isFilesRoute;
  const sidebarWidth = compactSidebar ? 72 : 412;

  const header = null;

  const sidebar = (
    <SidebarChats
      copy={copy}
      conversations={conversations}
      activeId={conversationId}
      unreadCounts={unreadCounts}
      isSettingsActive={isSettingsRoute}
      compact={compactSidebar}
      activeRailTab={isSettingsRoute ? "settings" : isIndexRoute ? "index" : isFilesRoute ? "files" : "chats"}
      onNew={(folderId) => newChat(folderId)}
      onOpenFolderPanel={openFolderPanel}
      onSelect={loadConversation}
      onDelete={deleteConversation}
      chatFolders={chatFolders}
      setChatFolders={setChatFolders}
      chatFolderMap={chatFolderMap}
      setChatFolderMap={setChatFolderMap}
      onOpenIndex={() => navigateRoute("/index")}
      onOpenFiles={() => navigateRoute("/files")}
      onGoSettings={() => navigateRoute("/settings")}
      onGoProfile={() => {
        localStorage.setItem("fyndoy_settings_tab", JSON.stringify("profile"));
        navigateRoute("/settings");
      }}
      onGoDashboard={() => navigateRoute("/dashboard")}
      onLogout={logout}
      onUpgradePlan={() => setStatus(copy?.workspace?.status?.upgradeSoon || APP_MESSAGES.en.workspace.status.upgradeSoon)}
      onHelp={() => setStatus(copy?.workspace?.status?.helpSoon || APP_MESSAGES.en.workspace.status.helpSoon)}
      onNotify={pushNotice}
    />
  );

  const dashboardMain = (
    <div className="workspace-chat-main workspace-page min-h-[420px] lg:flex lg:h-full lg:min-h-0 lg:flex-col">
      {(status || uploadProgress) ? (
        <div className="border-b border-[var(--border-color)] px-3 py-2 lg:px-4">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-elev)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            {status || (uploadProgress
              ? interpolate(copy?.workspace?.status?.uploading || APP_MESSAGES.en.workspace.status.uploading || "Uploading... {pct}%", { pct: uploadProgress.pct || 0 })
              : "")}
          </div>
          {uploadProgress ? (
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-elev)]">
              <div className="h-full bg-[var(--accent)]/70" style={{ width: `${uploadProgress.pct || 0}%` }} />
            </div>
          ) : null}
        </div>
      ) : null}
      {folderPanel ? (
        <>
          <FolderBoard
            folder={folderPanel}
            activeId={conversationId}
            onOpenChat={loadConversation}
            onNewChat={() => newChat(folderPanel?.id || "")}
            onDeleteChat={deleteConversation}
            onNotify={pushNotice}
            copy={copy}
            chatFolders={chatFolders}
            setChatFolders={setChatFolders}
            chatFolderMap={chatFolderMap}
            setChatFolderMap={setChatFolderMap}
          />
          <ChatComposer
            copy={copy}
            onSend={handleComposerSend}
            disabled={!token || uploading}
            onPickFolder={onPickFolder}
            onPickFiles={onPickFiles}
            onConnectLocal={handleConnectLiveFolder}
            thinkingMode={thinkingMode}
            setThinkingMode={setThinkingMode}
            model={chatModel}
            setModel={setChatModel}
            draftSeed={draftSeed}
            onNotify={pushNotice}
          />
        </>
      ) : (
        <>
          <ChatThread
            messages={messages}
            copy={copy}
            onNotify={pushNotice}
            onRetryMessage={onRetryMessage}
            onReplyMessage={onReplyMessage}
            onEditMessage={onEditMessage}
            onReactMessage={onReactMessage}
            reactionMap={messageReactions}
          />
          <ChatComposer
            copy={copy}
            onSend={handleComposerSend}
            disabled={!token || uploading}
            onPickFolder={onPickFolder}
            onPickFiles={onPickFiles}
            onConnectLocal={handleConnectLiveFolder}
            thinkingMode={thinkingMode}
            setThinkingMode={setThinkingMode}
            model={chatModel}
            setModel={setChatModel}
            draftSeed={draftSeed}
            onNotify={pushNotice}
          />
        </>
      )}
    </div>
  );

  const settingsMain = (
    <div className="workspace-chat-main workspace-page workspace-content-max p-4 lg:h-full">
      <div className="workspace-max-body">
        <SettingsPage
          token={token}
          copy={copy}
          themeMode={activeThemePreference}
          onThemeMode={setThemeMode}
          themeModes={APP_THEME_MODES}
          colorTheme={activeColorTheme.id}
          onColorTheme={setColorMode}
          colorThemes={APP_COLOR_THEMES}
          fontSize={activeFontSize.id}
          onFontSize={setFontSizeMode}
          fontSizes={APP_FONT_SIZES}
          fontPreset={activeFontPreset.id}
          onFontPreset={setFontMode}
          fontPresets={APP_FONT_PRESETS}
          locale={activeLocale}
          onLocale={setLocaleMode}
          locales={APP_LOCALES}
          searchMode={activeSearchMode}
          onSearchMode={setSearchModePref}
          searchModes={APP_SEARCH_MODES}
          fileTypePrefs={fileTypePrefs}
          onToggleFileType={toggleFileTypePref}
          fileTypeOptions={APP_FILE_TYPE_OPTIONS}
          cacheMode={activeCacheMode}
          onCacheMode={setCacheModePref}
          cacheModes={APP_CACHE_MODES}
          notificationPrefs={notificationPrefs}
          onToggleNotification={toggleNotificationPref}
          notificationOptions={APP_NOTIFICATION_OPTIONS}
          autoLock={activeAutoLock}
          onAutoLock={setAutoLockPref}
          autoLockOptions={APP_AUTO_LOCK_OPTIONS}
          onLogout={logout}
        />
      </div>
    </div>
  );

  const indexMain = (
    <div className="workspace-chat-main workspace-page workspace-content-max p-4 lg:h-full">
      <div className="workspace-max-body">
        <IndexFilesPage
          token={token}
          copy={copy}
          files={fileList}
          defaultTab="indexing"
          onRefreshFiles={refreshFileList}
        />
      </div>
    </div>
  );

  const filesMain = (
    <div className="workspace-chat-main workspace-page workspace-content-max p-4 lg:h-full">
      <div className="workspace-max-body">
        <IndexFilesPage
          token={token}
          copy={copy}
          files={fileList}
          defaultTab="files"
          onRefreshFiles={refreshFileList}
        />
      </div>
    </div>
  );

  return (
    <div className="app-root">
      <FlashNotices notices={notices} onDismiss={dismissNotice} copy={copy} />
      <Shell
        header={header}
        sidebarWidth={sidebarWidth}
        sidebar={sidebar}
        main={
          isSettingsRoute
            ? settingsMain
            : isIndexRoute
              ? indexMain
              : isFilesRoute
                ? filesMain
                : dashboardMain
        }
      />

      <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} token={token} file={previewFile} onDownload={downloadFile} copy={copy} />

      <Drawer
        open={processingDrawerOpen}
        title={copy?.workspace?.drawers?.analyzing || APP_MESSAGES.en.workspace.drawers.analyzing || "Analyzing"}
        onClose={() => {
          setProcessingDrawerOpen(false);
          setAnalysisTab("flow");
        }}
      >
        <div className="analysis-tabs">
          <button
            type="button"
            className={analysisTab === "flow" ? "analysis-tab is-active" : "analysis-tab"}
            onClick={() => setAnalysisTab("flow")}
          >
            {copy?.workspace?.drawers?.processing || APP_MESSAGES.en.workspace.drawers.processing || "Reasoning Trace"}
          </button>
          <button
            type="button"
            className={analysisTab === "trace" ? "analysis-tab is-active" : "analysis-tab"}
            onClick={() => setAnalysisTab("trace")}
          >
            {copy?.workspace?.drawers?.details || APP_MESSAGES.en.workspace.drawers.details || "Debug Details"}
          </button>
          <button
            type="button"
            className={analysisTab === "runs" ? "analysis-tab is-active" : "analysis-tab"}
            onClick={() => setAnalysisTab("runs")}
          >
            {copy?.workspace?.drawers?.runLogs || APP_MESSAGES.en.workspace.drawers.runLogs || "Execution Logs"}
          </button>
        </div>

        {analysisTab === "flow" ? (
          <ProcessingCard
            steps={lastProcessingRef.current.steps}
            confidence={lastProcessingRef.current.confidence}
            debug={lastProcessingRef.current.debug}
            copy={copy}
          />
        ) : null}

        {analysisTab === "trace" ? (
          <div className="analysis-trace-wrap">
            <pre>{JSON.stringify(lastProcessingRef.current.debug || {}, null, 2)}</pre>
          </div>
        ) : null}

        {analysisTab === "runs" ? <RunHistory token={token} conversationId={conversationId} copy={copy} /> : null}

        <div className="mt-3 text-xs text-[var(--text-muted)]">
          {lastProcessingRef.current.latency_ms != null
            ? interpolate(copy?.workspace?.status?.totalTime || APP_MESSAGES.en.workspace.status.totalTime || "Total time: {duration}", {
                duration: formatDuration(lastProcessingRef.current.latency_ms),
              })
            : ""}
        </div>
        <div className="mt-2 text-xs text-[var(--text-muted)]">
          {copy?.workspace?.status?.tip || APP_MESSAGES.en.workspace.status.tip || "Tip: Use \"Extend thinking\" for harder cases."}
        </div>
      </Drawer>
    </div>
  );
}
