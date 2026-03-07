import { buildAppMessages } from "../locales/index.js";

export const DEFAULT_LOCALE = "en";
export const DEFAULT_THEME_MODE = "system";
export const DEFAULT_COLOR_THEME = "emerald";
export const DEFAULT_FONT_PRESET = "manrope";
export const DEFAULT_FONT_SIZE = "medium";
export const DEFAULT_SEARCH_MODE = "balanced";
export const DEFAULT_CACHE_MODE = "normal";

export const APP_THEME_MODES = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export const APP_COLOR_THEMES = [
  { id: "emerald", label: "Emerald", accent: "#10b981", accentStrong: "#059669" },
  { id: "blue", label: "Blue", accent: "#3b82f6", accentStrong: "#2563eb" },
  { id: "indigo", label: "Indigo", accent: "#6366f1", accentStrong: "#4f46e5" },
  { id: "sky", label: "Sky", accent: "#0ea5e9", accentStrong: "#0284c7" },
  { id: "cyan", label: "Cyan", accent: "#06b6d4", accentStrong: "#0891b2" },
  { id: "teal", label: "Teal", accent: "#14b8a6", accentStrong: "#0d9488" },
  { id: "green", label: "Green", accent: "#22c55e", accentStrong: "#16a34a" },
  { id: "violet", label: "Violet", accent: "#8b5cf6", accentStrong: "#7c3aed" },
  { id: "purple", label: "Purple", accent: "#a855f7", accentStrong: "#9333ea" },
  { id: "pink", label: "Pink", accent: "#ec4899", accentStrong: "#db2777" },
  { id: "rose", label: "Rose", accent: "#f43f5e", accentStrong: "#e11d48" },
  { id: "red", label: "Red", accent: "#ef4444", accentStrong: "#dc2626" },
  { id: "orange", label: "Orange", accent: "#f97316", accentStrong: "#ea580c" },
  { id: "amber", label: "Amber", accent: "#f59e0b", accentStrong: "#d97706" },
  { id: "yellow", label: "Yellow", accent: "#eab308", accentStrong: "#ca8a04" },
  { id: "lime", label: "Lime", accent: "#84cc16", accentStrong: "#65a30d" },
  { id: "fuchsia", label: "Fuchsia", accent: "#d946ef", accentStrong: "#c026d3" },
  { id: "slate", label: "Slate", accent: "#64748b", accentStrong: "#475569" },
  { id: "gray", label: "Gray", accent: "#6b7280", accentStrong: "#4b5563" },
  { id: "zinc", label: "Zinc", accent: "#71717a", accentStrong: "#52525b" },
  { id: "neutral", label: "Neutral", accent: "#737373", accentStrong: "#525252" },
  { id: "stone", label: "Stone", accent: "#78716c", accentStrong: "#57534e" },
  { id: "taupe", label: "Taupe", accent: "#8b7f7a", accentStrong: "#6f625d" },
  { id: "mauve", label: "Mauve", accent: "#a18ab9", accentStrong: "#7f6a95" },
  { id: "mist", label: "Mist", accent: "#7da1b7", accentStrong: "#5e8297" },
  { id: "olive", label: "Olive", accent: "#84a14a", accentStrong: "#6a8236" },
  { id: "default", label: "Default", accent: "#16c4aa", accentStrong: "#0f9e8a" },
];

export const APP_FONT_PRESETS = [
  {
    id: "manrope",
    label: "Manrope",
    body: "\"Manrope\", \"Segoe UI\", sans-serif",
    display: "\"Space Grotesk\", \"Manrope\", sans-serif",
  },
  {
    id: "system",
    label: "System UI",
    body: "\"Segoe UI\", \"SF Pro Text\", \"Helvetica Neue\", sans-serif",
    display: "\"Segoe UI\", \"SF Pro Display\", \"Helvetica Neue\", sans-serif",
  },
  {
    id: "modern",
    label: "Modern Sans",
    body: "\"Avenir Next\", \"Manrope\", sans-serif",
    display: "\"Avenir Next\", \"Manrope\", sans-serif",
  },
  {
    id: "classic",
    label: "Classic Sans",
    body: "\"Trebuchet MS\", \"Segoe UI\", sans-serif",
    display: "\"Trebuchet MS\", \"Segoe UI\", sans-serif",
  },
  { id: "sfpro", label: "SF Pro", body: "\"SF Pro Text\", \"Segoe UI\", sans-serif", display: "\"SF Pro Display\", \"Segoe UI\", sans-serif" },
  { id: "inter", label: "Inter", body: "\"Inter\", \"Segoe UI\", sans-serif", display: "\"Inter\", \"Segoe UI\", sans-serif" },
  { id: "satoshi", label: "Satoshi", body: "\"Satoshi\", \"Manrope\", sans-serif", display: "\"Satoshi\", \"Manrope\", sans-serif" },
  { id: "geist", label: "Geist", body: "\"Geist\", \"Manrope\", sans-serif", display: "\"Geist\", \"Manrope\", sans-serif" },
  { id: "general-sans", label: "General Sans", body: "\"General Sans\", \"Manrope\", sans-serif", display: "\"General Sans\", \"Manrope\", sans-serif" },
  { id: "space", label: "Space Grotesk", body: "\"Space Grotesk\", \"Manrope\", sans-serif", display: "\"Space Grotesk\", \"Manrope\", sans-serif" },
  { id: "comic", label: "Comic Sans", body: "\"Comic Sans MS\", \"Comic Sans\", \"Segoe UI\", sans-serif", display: "\"Comic Sans MS\", \"Comic Sans\", \"Segoe UI\", sans-serif" },
  { id: "nunito", label: "Nunito", body: "\"Nunito\", \"Segoe UI\", sans-serif", display: "\"Nunito\", \"Segoe UI\", sans-serif" },
  { id: "work", label: "Work Sans", body: "\"Work Sans\", \"Segoe UI\", sans-serif", display: "\"Work Sans\", \"Segoe UI\", sans-serif" },
  { id: "dm-sans", label: "DM Sans", body: "\"DM Sans\", \"Segoe UI\", sans-serif", display: "\"DM Sans\", \"Segoe UI\", sans-serif" },
  { id: "urbanist", label: "Urbanist", body: "\"Urbanist\", \"Segoe UI\", sans-serif", display: "\"Urbanist\", \"Segoe UI\", sans-serif" },
  { id: "poppins", label: "Poppins", body: "\"Poppins\", \"Segoe UI\", sans-serif", display: "\"Poppins\", \"Segoe UI\", sans-serif" },
  { id: "montserrat", label: "Montserrat", body: "\"Montserrat\", \"Segoe UI\", sans-serif", display: "\"Montserrat\", \"Segoe UI\", sans-serif" },
  { id: "futura", label: "Futura", body: "\"Futura\", \"Segoe UI\", sans-serif", display: "\"Futura\", \"Segoe UI\", sans-serif" },
  { id: "helvetica", label: "Helvetica Neue", body: "\"Helvetica Neue\", \"Segoe UI\", sans-serif", display: "\"Helvetica Neue\", \"Segoe UI\", sans-serif" },
  { id: "optima", label: "Optima", body: "\"Optima\", \"Segoe UI\", sans-serif", display: "\"Optima\", \"Segoe UI\", sans-serif" },
  { id: "gotham", label: "Gotham", body: "\"Gotham\", \"Segoe UI\", sans-serif", display: "\"Gotham\", \"Segoe UI\", sans-serif" },
  { id: "proxima", label: "Proxima Nova", body: "\"Proxima Nova\", \"Segoe UI\", sans-serif", display: "\"Proxima Nova\", \"Segoe UI\", sans-serif" },
  { id: "lato", label: "Lato", body: "\"Lato\", \"Segoe UI\", sans-serif", display: "\"Lato\", \"Segoe UI\", sans-serif" },
  { id: "muli", label: "Mulish", body: "\"Mulish\", \"Segoe UI\", sans-serif", display: "\"Mulish\", \"Segoe UI\", sans-serif" },
  { id: "ibm", label: "IBM Plex Sans", body: "\"IBM Plex Sans\", \"Segoe UI\", sans-serif", display: "\"IBM Plex Sans\", \"Segoe UI\", sans-serif" },
  { id: "rubik", label: "Rubik", body: "\"Rubik\", \"Segoe UI\", sans-serif", display: "\"Rubik\", \"Segoe UI\", sans-serif" },
  { id: "noto", label: "Noto Sans", body: "\"Noto Sans\", \"Segoe UI\", sans-serif", display: "\"Noto Sans\", \"Segoe UI\", sans-serif" },
  { id: "source", label: "Source Sans 3", body: "\"Source Sans 3\", \"Segoe UI\", sans-serif", display: "\"Source Sans 3\", \"Segoe UI\", sans-serif" },
  { id: "karla", label: "Karla", body: "\"Karla\", \"Segoe UI\", sans-serif", display: "\"Karla\", \"Segoe UI\", sans-serif" },
  { id: "cabin", label: "Cabin", body: "\"Cabin\", \"Segoe UI\", sans-serif", display: "\"Cabin\", \"Segoe UI\", sans-serif" },
  { id: "jost", label: "Jost", body: "\"Jost\", \"Segoe UI\", sans-serif", display: "\"Jost\", \"Segoe UI\", sans-serif" },
  { id: "assistant", label: "Assistant", body: "\"Assistant\", \"Segoe UI\", sans-serif", display: "\"Assistant\", \"Segoe UI\", sans-serif" },
  { id: "ibm-condensed", label: "IBM Plex Sans Condensed", body: "\"IBM Plex Sans Condensed\", \"Segoe UI\", sans-serif", display: "\"IBM Plex Sans Condensed\", \"Segoe UI\", sans-serif" },
  { id: "circular", label: "Circular Std", body: "\"Circular Std\", \"Segoe UI\", sans-serif", display: "\"Circular Std\", \"Segoe UI\", sans-serif" },
  { id: "sohne", label: "Sohne", body: "\"Sohne\", \"Segoe UI\", sans-serif", display: "\"Sohne\", \"Segoe UI\", sans-serif" },
  { id: "tt-commons", label: "TT Commons", body: "\"TT Commons\", \"Segoe UI\", sans-serif", display: "\"TT Commons\", \"Segoe UI\", sans-serif" },
  { id: "gilroy", label: "Gilroy", body: "\"Gilroy\", \"Segoe UI\", sans-serif", display: "\"Gilroy\", \"Segoe UI\", sans-serif" },
  { id: "avenir", label: "Avenir", body: "\"Avenir\", \"Segoe UI\", sans-serif", display: "\"Avenir\", \"Segoe UI\", sans-serif" },
  { id: "rajdhani", label: "Rajdhani", body: "\"Rajdhani\", \"Segoe UI\", sans-serif", display: "\"Rajdhani\", \"Segoe UI\", sans-serif" },
];

export const APP_FONT_SIZES = [
  { id: "xs", label: "Extra Small", scale: 0.9 },
  { id: "small", label: "Small", scale: 0.95 },
  { id: "medium", label: "Medium", scale: 1 },
  { id: "large", label: "Large", scale: 1.08 },
  { id: "xl", label: "Extra Large", scale: 1.16 },
];

export const APP_SETTINGS_TABS = [
  { id: "profile", label: "Profile" },
  { id: "appearance", label: "Appearance" },
  { id: "sources", label: "Connected Folders" },
  { id: "search", label: "Search & Indexing" },
  { id: "notifications", label: "Notifications" },
  { id: "security", label: "Security & Sessions" },
  { id: "data", label: "Data Control" },
];

export const APP_SEARCH_MODES = [
  { id: "balanced", label: "Balanced", hint: "Balanced speed and precision" },
  { id: "strict", label: "Strict", hint: "Fewer but more confident matches" },
];

export const APP_CACHE_MODES = [
  { id: "normal", label: "Normal", hint: "Default repeat query speed" },
  { id: "aggressive", label: "Aggressive", hint: "Faster repeated searches" },
];

export const APP_FILE_TYPE_OPTIONS = [
  { id: "pdf", label: "PDFs" },
  { id: "image", label: "Images" },
  { id: "text", label: "Text" },
  { id: "docx", label: "DOCX" },
  { id: "other", label: "Others" },
];

export const APP_NOTIFICATION_OPTIONS = [
  { id: "index_start", label: "Indexing started / finished" },
  { id: "index_failed", label: "Indexing failed / file skipped" },
  { id: "folder_connected", label: "New folder connected" },
  { id: "security_alert", label: "Security alerts (new login/device)" },
];

export const APP_AUTO_LOCK_OPTIONS = [
  { id: "off", label: "Off", minutes: 0 },
  { id: "15", label: "15 min", minutes: 15 },
  { id: "30", label: "30 min", minutes: 30 },
  { id: "60", label: "60 min", minutes: 60 },
];

export const APP_COUNTRY_OPTIONS = [
  "United States",
  "India",
  "Germany",
  "United Kingdom",
  "Canada",
  "France",
  "United Arab Emirates",
  "Singapore",
  "Australia",
  "Japan",
];

export const APP_LOCALES = [
  { code: "en", flag: "🇺🇸", name: "English", native: "English" },
  { code: "hi", flag: "🇮🇳", name: "Hindi", native: "हिन्दी" },
  { code: "es", flag: "🇪🇸", name: "Spanish", native: "Español" },
  { code: "fr", flag: "🇫🇷", name: "French", native: "Français" },
  { code: "de", flag: "🇩🇪", name: "German", native: "Deutsch" },
  { code: "it", flag: "🇮🇹", name: "Italian", native: "Italiano" },
  { code: "pt", flag: "🇵🇹", name: "Portuguese", native: "Português" },
  { code: "ru", flag: "🇷🇺", name: "Russian", native: "Русский" },
  { code: "ja", flag: "🇯🇵", name: "Japanese", native: "日本語" },
  { code: "ko", flag: "🇰🇷", name: "Korean", native: "한국어" },
  { code: "zh", flag: "🇨🇳", name: "Chinese", native: "中文" },
  { code: "ar", flag: "🇸🇦", name: "Arabic", native: "العربية" },
  { code: "tr", flag: "🇹🇷", name: "Turkish", native: "Türkçe" },
  { code: "nl", flag: "🇳🇱", name: "Dutch", native: "Nederlands" },
  { code: "pl", flag: "🇵🇱", name: "Polish", native: "Polski" },
  { code: "sv", flag: "🇸🇪", name: "Swedish", native: "Svenska" },
  { code: "no", flag: "🇳🇴", name: "Norwegian", native: "Norsk" },
  { code: "da", flag: "🇩🇰", name: "Danish", native: "Dansk" },
  { code: "fi", flag: "🇫🇮", name: "Finnish", native: "Suomi" },
  { code: "cs", flag: "🇨🇿", name: "Czech", native: "Čeština" },
  { code: "ro", flag: "🇷🇴", name: "Romanian", native: "Română" },
  { code: "uk", flag: "🇺🇦", name: "Ukrainian", native: "Українська" },
  { code: "th", flag: "🇹🇭", name: "Thai", native: "ไทย" },
  { code: "id", flag: "🇮🇩", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "vi", flag: "🇻🇳", name: "Vietnamese", native: "Tiếng Việt" },
  { code: "ms", flag: "🇲🇾", name: "Malay", native: "Bahasa Melayu" },
  { code: "bn", flag: "🇧🇩", name: "Bengali", native: "বাংলা" },
  { code: "ta", flag: "🇮🇳", name: "Tamil", native: "தமிழ்" },
  { code: "te", flag: "🇮🇳", name: "Telugu", native: "తెలుగు" },
  { code: "mr", flag: "🇮🇳", name: "Marathi", native: "मराठी" },
  { code: "gu", flag: "🇮🇳", name: "Gujarati", native: "ગુજરાતી" },
  { code: "pa", flag: "🇮🇳", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "ur", flag: "🇵🇰", name: "Urdu", native: "اردو" },
  { code: "fa", flag: "🇮🇷", name: "Persian", native: "فارسی" },
];

export const APP_PUBLIC_MENU_GROUPS = [
  {
    title: "Use Cases",
    links: ["Find by Content", "Find by Hints", "Cross-Source Search", "Instant Summaries"],
  },
  {
    title: "Workflows",
    links: ["Extract Details", "Generate Output", "Organize Files", "Share Anywhere"],
  },
  {
    title: "Trust",
    links: ["Security", "Privacy", "Compliance", "Support"],
  },
];

export const APP_MESSAGES = buildAppMessages(APP_LOCALES.map((item) => item.code));

export const RTL_LOCALES = new Set(["ar", "fa", "ur"]);
