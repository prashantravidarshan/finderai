import React, { useEffect, useMemo, useRef, useState } from "react";
import UploadMenu from "./UploadMenu.jsx";
import { APP_MESSAGES } from "../../config/appConfig.js";

const WAVE_BAR_COUNT = 56;

function createFlatWave() {
  return Array.from({ length: WAVE_BAR_COUNT }, () => 0.08);
}

function mergeVoiceText(seed, finalText, interimText) {
  const base = String(seed || "").trim();
  const spoken = `${String(finalText || "").trim()} ${String(interimText || "").trim()}`.trim();
  if (!spoken) return base;
  return base ? `${base} ${spoken}` : spoken;
}

export default function ChatComposer({
  onSend,
  disabled,
  onPickFolder,
  onPickFiles,
  onConnectLocal,
  thinkingMode,
  setThinkingMode,
  model,
  setModel,
  draftSeed,
  onNotify,
  copy,
}) {
  const chatText = copy?.chat || APP_MESSAGES.en.chat;
  const [text, setText] = useState("");
  const [controlsOpen, setControlsOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceSeed, setVoiceSeed] = useState("");
  const [voiceFinal, setVoiceFinal] = useState("");
  const [voiceInterim, setVoiceInterim] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [voiceBars, setVoiceBars] = useState(() => createFlatWave());
  const [voiceHasSignal, setVoiceHasSignal] = useState(false);
  const inputRef = useRef(null);
  const controlsRef = useRef(null);
  const recognitionRef = useRef(null);
  const voiceSeedRef = useRef("");
  const voiceFinalRef = useRef("");
  const voiceInterimRef = useRef("");
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const meterFrameRef = useRef(0);
  const meterLastRef = useRef(0);
  const modelOptions = useMemo(
    () => [
      { id: "auto", label: chatText.modelAuto || "Auto" },
      { id: "gpt-5.2", label: chatText.modelReasoning || "GPT-5.2" },
      { id: "gpt-4.1", label: chatText.modelBalanced || "GPT-4.1" },
    ],
    [chatText.modelAuto, chatText.modelBalanced, chatText.modelReasoning]
  );

  async function send() {
    const msg = text.trim();
    if (!msg) return;
    setText("");
    if (inputRef.current) {
      inputRef.current.style.height = "0px";
    }
    await onSend(msg);
  }

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    const maxHeight = 10 * 24;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [text]);

  useEffect(() => {
    const seed = typeof draftSeed === "string" ? draftSeed : draftSeed?.text;
    if (!seed) return;
    setText(seed);
    const el = inputRef.current;
    if (el) {
      el.focus();
      const length = seed.length;
      el.setSelectionRange(length, length);
    }
  }, [draftSeed]);

  useEffect(() => {
    function onDown(event) {
      if (!controlsRef.current) return;
      if (controlsRef.current.contains(event.target)) return;
      setControlsOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const voiceDraft = useMemo(
    () => mergeVoiceText(voiceSeed, voiceFinal, voiceInterim),
    [voiceSeed, voiceFinal, voiceInterim]
  );

  function resetVoiceVisuals() {
    setVoiceBars(createFlatWave());
    setVoiceHasSignal(false);
  }

  function stopMeter() {
    if (meterFrameRef.current) {
      window.cancelAnimationFrame(meterFrameRef.current);
      meterFrameRef.current = 0;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    resetVoiceVisuals();
  }

  async function startMeter() {
    if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
      resetVoiceVisuals();
      return;
    }
    stopMeter();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        mediaStreamRef.current = stream;
        return;
      }
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      mediaStreamRef.current = stream;
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.fftSize);
      meterLastRef.current = 0;

      const tick = (now = 0) => {
        if (!analyserRef.current) return;
        meterFrameRef.current = window.requestAnimationFrame(tick);
        if (now - meterLastRef.current < 55) return;
        meterLastRef.current = now;
        analyserRef.current.getByteTimeDomainData(data);
        let rms = 0;
        for (let i = 0; i < data.length; i += 1) {
          const normalized = (data[i] - 128) / 128;
          rms += normalized * normalized;
        }
        rms = Math.sqrt(rms / data.length);
        const hasSignal = rms > 0.02;
        setVoiceHasSignal(hasSignal);
        if (!hasSignal) {
          setVoiceBars(createFlatWave());
          return;
        }
        const step = Math.max(1, Math.floor(data.length / WAVE_BAR_COUNT));
        const nextBars = new Array(WAVE_BAR_COUNT).fill(0.08).map((_, idx) => {
          const sample = Math.abs((data[Math.min(data.length - 1, idx * step)] - 128) / 128);
          return Math.max(0.08, Math.min(0.95, sample * 2.7));
        });
        setVoiceBars(nextBars);
      };

      meterFrameRef.current = window.requestAnimationFrame(tick);
    } catch {
      resetVoiceVisuals();
      onNotify?.(chatText.audioNotSupported || "Audio is not supported on this device.", "warning");
    }
  }

  function stopRecognition() {
    try {
      recognitionRef.current?.stop();
    } catch {}
  }

  function clearVoiceState() {
    setVoiceFinal("");
    setVoiceInterim("");
    setVoiceError("");
    setVoiceSeed("");
    voiceSeedRef.current = "";
    voiceFinalRef.current = "";
    voiceInterimRef.current = "";
    setVoiceListening(false);
    setVoiceMode(false);
    resetVoiceVisuals();
  }

  function cancelVoiceInput() {
    stopRecognition();
    stopMeter();
    setText(voiceSeedRef.current || "");
    clearVoiceState();
    inputRef.current?.focus();
  }

  function confirmVoiceInput() {
    const merged = mergeVoiceText(voiceSeedRef.current, voiceFinalRef.current, voiceInterimRef.current);
    stopRecognition();
    stopMeter();
    setText(merged);
    clearVoiceState();
    inputRef.current?.focus();
  }

  function ensureRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    if (!recognitionRef.current) {
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.onresult = (event) => {
        let interim = "";
        let finalized = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const res = event.results[i];
          const transcript = res[0]?.transcript || "";
          if (res.isFinal) finalized += `${transcript} `;
          else interim += transcript;
        }
        if (finalized.trim()) {
          voiceFinalRef.current = `${voiceFinalRef.current} ${finalized.trim()}`.trim();
        }
        voiceInterimRef.current = interim.trim();
        setVoiceFinal(voiceFinalRef.current);
        setVoiceInterim(voiceInterimRef.current);
        setText(mergeVoiceText(voiceSeedRef.current, voiceFinalRef.current, voiceInterimRef.current));
      };
      recog.onerror = (e) => {
        const err = e?.error || "microphone_error";
        if (err !== "aborted") {
          setVoiceError(err);
          onNotify?.(chatText.audioNotSupported || "Audio is not supported on this device.", "warning");
        }
        setVoiceListening(false);
      };
      recog.onend = () => {
        setVoiceListening(false);
      };
      recognitionRef.current = recog;
    }
    recognitionRef.current.lang = navigator.language || "en-US";
    return recognitionRef.current;
  }

  async function startVoiceInput() {
    const recognition = ensureRecognition();
    if (!recognition) {
      onNotify?.(chatText.audioNotSupported || "Audio is not supported on this device.", "warning");
      return;
    }
    setControlsOpen(false);
    setVoiceError("");
    const seed = text.trim();
    setVoiceSeed(seed);
    voiceSeedRef.current = seed;
    setVoiceFinal("");
    setVoiceInterim("");
    voiceFinalRef.current = "";
    voiceInterimRef.current = "";
    setVoiceMode(true);
    setVoiceListening(true);
    setText(seed);
    try {
      recognition.start();
    } catch {
      // Ignore "already started" and similar runtime states.
    }
    await startMeter();
  }

  function toggleThinking(value) {
    setThinkingMode?.(value ? "deep" : "fast");
  }

  useEffect(() => () => {
    stopRecognition();
    stopMeter();
  }, []);

  return (
    <div className="chat-composer-wrap border-t border-[var(--border-color)] bg-[color-mix(in_srgb,var(--surface-card)_86%,transparent)] px-3 pb-3 pt-2 lg:px-4 lg:pb-4">
      <div className="chat-composer-shell">
        <div className="chat-composer-input-wrap">
          <div className={voiceMode ? "chat-composer-input-shell is-voice" : "chat-composer-input-shell"}>
            {voiceMode ? (
              <div className={voiceHasSignal ? "chat-composer-voice-strip is-live" : "chat-composer-voice-strip"}>
                <div className={voiceHasSignal ? "chat-composer-voice-wave is-live" : "chat-composer-voice-wave is-flat"}>
                  {voiceBars.map((bar, idx) => (
                    <span key={idx} style={{ "--bar-h": `${bar}rem` }} />
                  ))}
                </div>
              </div>
            ) : null}

            <div className="chat-composer-main-row">
              <div className="chat-composer-upload">
                <UploadMenu embedded onPickFolder={onPickFolder} onPickFiles={onPickFiles} onConnectLocal={onConnectLocal} copy={copy} />
              </div>

              <textarea
                ref={inputRef}
                placeholder={chatText.messagePlaceholder || "Type a message..."}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={1}
                className="chat-composer-input"
                onKeyDown={(e) => {
                  if (voiceMode) return;
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />

              <div className="chat-composer-controls" ref={controlsRef}>
                <button
                  type="button"
                  className={controlsOpen ? "chat-composer-control-btn is-open" : "chat-composer-control-btn"}
                  onClick={() => setControlsOpen((v) => !v)}
                  title={chatText.controls || "Message options"}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12h16M4 6h10M4 18h13" />
                  </svg>
                  <span>
                    {(modelOptions.find((item) => item.id === (model || "auto"))?.label || modelOptions[0].label).toLowerCase()}
                  </span>
                  <svg className="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {controlsOpen ? (
                  <div className="chat-composer-controls-menu workspace-popover">
                    <div className="chat-composer-menu-title">{chatText.model || "Model"}</div>
                    {modelOptions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="workspace-menu-item"
                        onClick={() => setModel?.(item.id)}
                      >
                        <span className="workspace-menu-item-label">
                          <span className="workspace-menu-item-icon" aria-hidden="true">
                            {item.id === "auto" ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 12h16" />
                                <path d="m12 4 8 8-8 8" />
                              </svg>
                            ) : item.id === "gpt-5.2" ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 3 4 7v10l8 4 8-4V7z" />
                                <path d="M12 7v10" />
                                <path d="m4 7 8 4 8-4" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="4" y="4" width="16" height="16" rx="2" />
                                <path d="M8 9h8M8 13h5" />
                              </svg>
                            )}
                          </span>
                          <span>{item.label}</span>
                        </span>
                        <span className="workspace-menu-arrow">
                          {(model || "auto") === item.id ? "✓" : ""}
                        </span>
                      </button>
                    ))}
                    <div className="chat-composer-menu-sep" />
                    <div className="chat-composer-thinking-toggle">
                      <div>
                        <strong>{chatText.deep || "Extend thinking"}</strong>
                        <small>{chatText.thinkingHint || "Use deeper reasoning for hard queries."}</small>
                      </div>
                      <button
                        type="button"
                        className={thinkingMode === "deep" ? "chat-switch is-on" : "chat-switch"}
                        aria-pressed={thinkingMode === "deep"}
                        onClick={() => toggleThinking(thinkingMode !== "deep")}
                      >
                        <span />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                className={voiceMode ? "chat-composer-mic is-cancel" : "chat-composer-mic"}
                title={voiceMode ? (chatText.cancel || "Cancel") : (chatText.mic || "Voice input")}
                onClick={voiceMode ? cancelVoiceInput : startVoiceInput}
              >
                {voiceMode ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="3" width="6" height="12" rx="3" />
                    <path d="M5 11a7 7 0 0 0 14 0" />
                    <path d="M12 18v3" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                className={voiceMode ? "chat-composer-send is-confirm" : "chat-composer-send"}
                onClick={voiceMode ? confirmVoiceInput : send}
                disabled={voiceMode ? !voiceDraft.trim() : (disabled || !text.trim())}
                title={voiceMode ? (chatText.insert || "Apply") : (chatText.send || "Send")}
              >
                {voiceMode ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12L20 4L14 20L11 13L4 12Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {voiceError ? <div className="settings-error mt-2">{voiceError}</div> : null}
        </div>
      </div>
    </div>
  );
}
