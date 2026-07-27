import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { AI_CHAT_HISTORY_KEY, AI_CHAT_MINIMIZED_KEY } from "../data";

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export type AiProvider = "openai" | "gemini" | "grok" | null;

async function getAiToken(): Promise<string | null> {
  return (await (window as any).Clerk?.session?.getToken()) ?? null;
}

export function useHomeAI() {
  const { t } = useLanguage();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>(() => {
    try {
      const saved = localStorage.getItem(AI_CHAT_HISTORY_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved) as AiMessage[];
      return Array.isArray(parsed) ? parsed.filter(m => !m.streaming) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<AiProvider>(null);
  const [minimized, setMinimized] = useState<boolean>(() => {
    try { return localStorage.getItem(AI_CHAT_MINIMIZED_KEY) === "1"; } catch { return false; }
  });
  const [fabHovered, setFabHovered] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);

  const voiceSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    try { localStorage.setItem(AI_CHAT_MINIMIZED_KEY, minimized ? "1" : "0"); } catch {}
  }, [minimized]);

  useEffect(() => {
    try {
      const toSave = messages.filter(m => !m.streaming).slice(-60);
      localStorage.setItem(AI_CHAT_HISTORY_KEY, JSON.stringify(toSave));
    } catch {}
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: AiMessage = { role: "user", content: text.trim() };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setInput("");
    setLoading(true);
    setProvider(null);

    const assistant: AiMessage = { role: "assistant", content: "", streaming: true };
    setMessages([...nextMsgs, assistant]);

    const token = await getAiToken();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        signal: ctrl.signal,
        body: JSON.stringify({ messages: nextMsgs.map(({ role, content }) => ({ role, content })) }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const p = JSON.parse(payload);
            if (p.provider) {
              setProvider(p.provider as AiProvider);
            } else if (p.error) {
              acc = p.error;
              setMessages(prev => {
                const u = [...prev];
                u[u.length - 1] = { role: "assistant", content: acc, streaming: true };
                return u;
              });
            } else if (p.text) {
              acc += p.text;
              setMessages(prev => {
                const u = [...prev];
                u[u.length - 1] = { role: "assistant", content: acc, streaming: true };
                return u;
              });
            }
          } catch {}
        }
      }
      setMessages(prev => {
        const u = [...prev];
        u[u.length - 1] = { role: "assistant", content: acc || t.chatError, streaming: false };
        return u;
      });
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setMessages(prev => {
        const u = [...prev];
        u[u.length - 1] = { role: "assistant", content: t.chatError, streaming: false };
        return u;
      });
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
    setLoading(false);
    setMessages(prev => {
      const u = [...prev];
      const last = u[u.length - 1];
      if (last?.streaming) u[u.length - 1] = { ...last, streaming: false };
      return u;
    });
  }

  async function shareMessage(content: string, idx: number) {
    const text = `✡ Rav Menashe AI\n\n${content}\n\n— Bnei Menashe Calendar`;
    if (navigator.share) {
      try { await navigator.share({ title: "Rav Menashe AI", text }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {}
  }

  function toggleVoice() {
    if (!voiceSupported) {
      setVoiceError(t.chatVoiceUnsupported);
      setTimeout(() => setVoiceError(null), 3000);
      return;
    }
    if (isListening) { recognitionRef.current?.stop(); return; }
    setVoiceError(null);
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    let finalTranscript = "";

    rec.onstart  = () => setIsListening(true);
    rec.onend    = () => {
      setIsListening(false);
      if (finalTranscript.trim()) {
        setInput(prev => {
          const joined = prev.trim() ? prev.trim() + " " + finalTranscript.trim() : finalTranscript.trim();
          return joined;
        });
        setTimeout(() => inputRef.current?.focus(), 80);
      }
    };
    rec.onerror  = (e: any) => {
      setIsListening(false);
      if (e.error !== "aborted" && e.error !== "no-speech") {
        setVoiceError(t.chatVoiceUnsupported);
        setTimeout(() => setVoiceError(null), 3000);
      }
    };
    rec.onresult = (e: any) => {
      let interim = "";
      finalTranscript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setInput(interim || finalTranscript);
    };
    rec.start();
  }

  function minimize() { setOpen(false); setMinimized(true); }
  function restore()  { setMinimized(false); }

  return {
    open, setOpen,
    messages, setMessages,
    input, setInput,
    loading,
    provider,
    minimized,
    fabHovered, setFabHovered,
    isListening,
    voiceError,
    copiedIdx,
    bottomRef,
    inputRef,
    voiceSupported,
    sendMessage,
    handleStop,
    shareMessage,
    toggleVoice,
    minimize,
    restore,
  };
}
