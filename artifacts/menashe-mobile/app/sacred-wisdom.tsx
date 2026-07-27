/**
 * SPR-M012 — Sacred Wisdom · Rav Menashe
 * ChatGPT-style chat interface — professional, clean, no button clusters.
 *
 * Architecture rules (SPR-M012):
 *   ✓ Web untouched                 ✓ Existing AI backend reused (POST /api/chat)
 *   ✓ Shared Core reused            ✓ Mobile Shell reused
 *   ✓ MMDL followed                 ✓ MEL followed
 *   ✓ No duplicate AI logic         ✓ No new AI system created
 *   ✓ Streaming messages            ✓ Accessibility (VoiceOver / TalkBack / Dynamic Type)
 *   ✓ 60 FPS (FlatList + memoization) ✓ Reduced Motion respected
 */

import React, {
  memo, useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { fetch } from "expo/fetch";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@clerk/expo";
import { hapticLight } from "@/src/mobile/lib/haptics";
import { useReducedMotion } from "@/src/mobile/lib/useEntrance";
import { usePressScale } from "@/src/mobile/lib/usePressScale";
import { useThemeTokens } from "@/src/mobile/design-system";
import { storageGet, storageSet } from "@/lib/storageUtils";
import { useLanguage } from "@/context/LanguageContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
const CONV_STORAGE_KEY = "menashe-sacred-wisdom-convs-v1";
const MAX_CONVERSATIONS = 20;
const READING_MAX_WIDTH = 680;

/** 4 contextual suggestions shown in the empty state (ChatGPT-style). */
const SUGGESTIONS = [
  { icon: "book-open" as const, text: "What is this week's Parashah?" },
  { icon: "calendar"  as const, text: "What Jewish holidays are coming up?" },
  { icon: "layers"    as const, text: "Explain today's Daf Yomi simply" },
  { icon: "sun"       as const, text: "How do Bnei Menashe observe Shabbat?" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type AiProvider = "openai" | "gemini" | "grok";
type MessageRole = "user" | "assistant";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  streaming?: boolean;
  provider?: AiProvider;
  timestamp: number;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getConvTitle(messages: Message[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "Conversation";
  const text = first.content.trim();
  return text.length > 50 ? text.slice(0, 47) + "…" : text;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m} ${ampm}`;
}

function formatRelative(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60)     return "Just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Streaming ────────────────────────────────────────────────────────────────

async function* streamChat(
  messages: Array<{ role: string; content: string }>,
  token: string | null,
  signal: AbortSignal,
): AsyncGenerator<{ text?: string; provider?: AiProvider; error?: string; done?: boolean }> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal,
    body: JSON.stringify({ messages }),
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") { yield { done: true }; return; }
      try { yield JSON.parse(payload); } catch {}
    }
  }
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function parseInline(
  text: string,
  baseStyle: object,
  boldStyle: object,
  italicStyle: object,
  codeStyle: object,
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(<Text key={i++} style={baseStyle}>{text.slice(last, m.index)}</Text>);
    const raw = m[0];
    if (raw.startsWith("**"))       parts.push(<Text key={i++} style={[baseStyle, boldStyle]}>{raw.slice(2, -2)}</Text>);
    else if (raw.startsWith("*"))   parts.push(<Text key={i++} style={[baseStyle, italicStyle]}>{raw.slice(1, -1)}</Text>);
    else                            parts.push(<Text key={i++} style={[baseStyle, codeStyle]}>{raw.slice(1, -1)}</Text>);
    last = m.index + raw.length;
  }
  if (last < text.length) parts.push(<Text key={i++} style={baseStyle}>{text.slice(last)}</Text>);
  return parts;
}

const SimpleMarkdown = memo(function SimpleMarkdown({
  content,
  textColor,
  mutedColor,
  accentColor,
}: { content: string; textColor: string; mutedColor: string; accentColor: string }) {
  const monoFont = Platform.select({ ios: "Courier New", android: "monospace", default: "monospace" });
  const baseStyle   = { color: textColor,  fontSize: 15, lineHeight: 24, fontFamily: "Inter_400Regular" };
  const boldStyle   = { fontFamily: "Inter_700Bold" };
  const italicStyle = { fontStyle: "italic" as const };
  const codeStyle   = { fontFamily: monoFont, backgroundColor: accentColor + "1a", borderRadius: 4, paddingHorizontal: 4 };
  const blocks = content.split(/\n\n+/);
  return (
    <View style={{ gap: 10 }}>
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        if (lines[0].startsWith("### ")) return <Text key={bi} style={{ color: textColor, fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 0.2, marginTop: 4 }}>{lines[0].slice(4)}</Text>;
        if (lines[0].startsWith("## "))  return <Text key={bi} style={{ color: textColor, fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: -0.2, marginTop: 4 }}>{lines[0].slice(3)}</Text>;
        if (lines[0].startsWith("# "))   return <Text key={bi} style={{ color: textColor, fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.4, marginTop: 4 }}>{lines[0].slice(2)}</Text>;
        if (lines.every((l) => l.match(/^[-*•]\s/))) return (
          <View key={bi} style={{ gap: 6 }}>
            {lines.map((l, li) => (
              <View key={li} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                <Text style={{ color: accentColor, fontSize: 15, lineHeight: 24 }}>•</Text>
                <Text style={{ flex: 1, ...baseStyle }}>{parseInline(l.slice(2).trim(), baseStyle, boldStyle, italicStyle, codeStyle)}</Text>
              </View>
            ))}
          </View>
        );
        if (lines.every((l) => l.match(/^\d+\.\s/))) return (
          <View key={bi} style={{ gap: 6 }}>
            {lines.map((l, li) => {
              const nm = l.match(/^(\d+)\.\s(.*)/);
              if (!nm) return null;
              return (
                <View key={li} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                  <Text style={{ color: accentColor, fontSize: 15, lineHeight: 24, fontFamily: "Inter_600SemiBold", minWidth: 18 }}>{nm[1]}.</Text>
                  <Text style={{ flex: 1, ...baseStyle }}>{parseInline(nm[2].trim(), baseStyle, boldStyle, italicStyle, codeStyle)}</Text>
                </View>
              );
            })}
          </View>
        );
        return <Text key={bi} style={baseStyle}>{parseInline(lines.join(" "), baseStyle, boldStyle, italicStyle, codeStyle)}</Text>;
      })}
    </View>
  );
});

// ─── Typing Indicator ─────────────────────────────────────────────────────────

const TypingIndicator = memo(function TypingIndicator({ color }: { color: string }) {
  const anims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  useEffect(() => {
    const loop = Animated.loop(
      Animated.stagger(160, anims.map((a) =>
        Animated.sequence([
          Animated.timing(a, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0, duration: 320, useNativeDriver: true }),
        ])
      ))
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <View style={{ flexDirection: "row", gap: 5, alignItems: "center", paddingVertical: 4 }}>
      {anims.map((a, i) => (
        <Animated.View key={i} style={{
          width: 7, height: 7, borderRadius: 3.5, backgroundColor: color,
          opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.9] }),
          transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.15] }) }],
        }} />
      ))}
    </View>
  );
});

// ─── Message Bubble ───────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: Message;
  colors: ReturnType<typeof useThemeTokens>["colors"];
  accentPrimary: string;
  accentGold: string;
  reducedMotion: boolean;
}

const MessageBubble = memo(function MessageBubble({
  message, colors, accentPrimary, accentGold, reducedMotion,
}: MessageBubbleProps) {
  const isUser      = message.role === "user";
  const isStreaming = !!message.streaming;

  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  useEffect(() => {
    if (reducedMotion) return;
    Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [opacity, reducedMotion]);

  return (
    <Animated.View style={{ opacity, marginBottom: 20 }}>
      {/* Sender row */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6, justifyContent: isUser ? "flex-end" : "flex-start" }}>
        {!isUser && (
          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: accentPrimary + "22", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: accentPrimary + "33" }}>
            <Text style={{ fontSize: 13 }}>✡</Text>
          </View>
        )}
        <Text style={{
          fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.6,
          color: isUser ? accentGold : accentPrimary, textTransform: "uppercase",
        }}>
          {isUser ? "You" : "Rav Menashe"}
        </Text>
      </View>

      {/* Bubble */}
      <View style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "88%",
        backgroundColor: isUser ? accentGold + "18" : colors.card,
        borderRadius: 20,
        borderBottomRightRadius: isUser ? 4 : 20,
        borderBottomLeftRadius:  isUser ? 20 : 4,
        borderWidth: 1,
        borderColor: isUser ? accentGold + "28" : colors.cardBorder,
        paddingHorizontal: 16,
        paddingVertical: 13,
      }}>
        {isStreaming && !message.content ? (
          <TypingIndicator color={accentPrimary} />
        ) : isUser ? (
          <Text style={{ color: colors.textPrimary, fontSize: 15, lineHeight: 24, fontFamily: "Inter_400Regular" }}>
            {message.content}
          </Text>
        ) : (
          <SimpleMarkdown content={message.content} textColor={colors.textPrimary} mutedColor={colors.textMuted} accentColor={accentPrimary} />
        )}
        {isStreaming && message.content ? <Text style={{ color: accentPrimary, fontSize: 14 }}> ▍</Text> : null}
      </View>

      {/* Timestamp + provider */}
      {!isStreaming && (
        <View style={{ flexDirection: isUser ? "row-reverse" : "row", alignItems: "center", gap: 6, marginTop: 4 }}>
          <Text style={{ fontSize: 10, color: colors.textMuted + "70", fontFamily: "Inter_400Regular" }}>
            {formatTime(message.timestamp)}
          </Text>
          {!isUser && message.provider && (
            <Text style={{ fontSize: 9, color: colors.textMuted + "55", fontFamily: "Inter_400Regular" }}>
              via {message.provider === "openai" ? "OpenAI" : message.provider === "gemini" ? "Gemini" : "Grok"}
            </Text>
          )}
        </View>
      )}
    </Animated.View>
  );
});

// ─── Suggestion Pill ──────────────────────────────────────────────────────────

const SuggestionPill = memo(function SuggestionPill({
  icon, text, onPress, colors, accentPrimary,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  text: string;
  onPress: () => void;
  colors: ReturnType<typeof useThemeTokens>["colors"];
  accentPrimary: string;
}) {
  const { scale, onPressIn, onPressOut } = usePressScale(0.96);
  return (
    <Animated.View style={{ transform: [{ scale }], flex: 1, minWidth: "45%" }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={text}
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          padding: 16,
          gap: 10,
          minHeight: 80,
          justifyContent: "space-between",
        }}
      >
        <Feather name={icon} size={16} color={accentPrimary} />
        <Text style={{ color: colors.textPrimary, fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 19 }}>
          {text}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

// ─── History Modal ────────────────────────────────────────────────────────────

const HistoryModal = memo(function HistoryModal({
  visible,
  conversations,
  onClose,
  onResume,
  onDelete,
  onPin,
  colors,
  accentPrimary,
  accentGold,
  insets,
}: {
  visible: boolean;
  conversations: Conversation[];
  onClose: () => void;
  onResume: (conv: Conversation) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  colors: ReturnType<typeof useThemeTokens>["colors"];
  accentPrimary: string;
  accentGold: string;
  insets: { top: number; bottom: number };
}) {
  const sorted = useMemo(
    () => [...conversations].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt),
    [conversations],
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Modal header */}
        <View style={{
          paddingTop: insets.top + 16, paddingBottom: 16, paddingHorizontal: 20,
          flexDirection: "row", alignItems: "center", gap: 12,
          borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color: colors.textPrimary, letterSpacing: -0.3 }}>
              Conversations
            </Text>
            <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.textMuted, marginTop: 1 }}>
              {conversations.length} saved
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close history"
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <Feather name="x" size={18} color={colors.textPrimary} />
          </Pressable>
        </View>

        {sorted.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
            <Feather name="message-circle" size={40} color={colors.textMuted + "60"} />
            <Text style={{ color: colors.textMuted, fontSize: 15, fontFamily: "Inter_400Regular" }}>No conversations yet</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: (insets.bottom || 0) + 24 }}>
            {sorted.map((conv) => (
              <Pressable
                key={conv.id}
                onPress={() => { onResume(conv); onClose(); }}
                accessibilityRole="button"
                accessibilityLabel={`Resume: ${conv.title}`}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 14, borderWidth: 1,
                  borderColor: conv.pinned ? accentGold + "40" : colors.cardBorder,
                  padding: 14, flexDirection: "row", alignItems: "center", gap: 12,
                }}
              >
                <View style={{
                  width: 38, height: 38, borderRadius: 19,
                  backgroundColor: (conv.pinned ? accentGold : accentPrimary) + "18",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Feather name={conv.pinned ? "bookmark" : "message-circle"} size={15} color={conv.pinned ? accentGold : accentPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontFamily: "Inter_500Medium" }} numberOfLines={1}>
                    {conv.title}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 }}>
                    {conv.messages.length} message{conv.messages.length !== 1 ? "s" : ""} · {formatRelative(conv.updatedAt)}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 4 }}>
                  <Pressable onPress={() => onPin(conv.id)} hitSlop={8} style={{ padding: 8, minWidth: 40, minHeight: 40, alignItems: "center", justifyContent: "center" }}>
                    <Feather name="bookmark" size={15} color={conv.pinned ? accentGold : colors.textMuted} />
                  </Pressable>
                  <Pressable onPress={() => onDelete(conv.id)} hitSlop={8} style={{ padding: 8, minWidth: 40, minHeight: 40, alignItems: "center", justifyContent: "center" }}>
                    <Feather name="trash-2" size={14} color={colors.textMuted} />
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
});

// ─── Empty State (ChatGPT-style centered welcome) ─────────────────────────────

function EmptyState({
  onSuggestion,
  colors,
  accentPrimary,
  accentGold,
}: {
  onSuggestion: (text: string) => void;
  colors: ReturnType<typeof useThemeTokens>["colors"];
  accentPrimary: string;
  accentGold: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingBottom: 40 }}>
      {/* Avatar */}
      <View style={{
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: accentPrimary + "18",
        borderWidth: 1.5, borderColor: accentPrimary + "35",
        alignItems: "center", justifyContent: "center",
        marginBottom: 20,
      }}>
        <Text style={{ fontSize: 36 }}>✡</Text>
      </View>

      <Text style={{ fontSize: 26, fontFamily: "Inter_700Bold", color: colors.textPrimary, letterSpacing: -0.5, marginBottom: 8, textAlign: "center" }}>
        Rav Menashe
      </Text>
      <Text style={{ fontSize: 15, fontFamily: "Inter_400Regular", color: colors.textMuted, textAlign: "center", lineHeight: 22, marginBottom: 36, maxWidth: 280 }}>
        Your guide to Torah, prayer, and the traditions of Bnei Menashe
      </Text>

      {/* 2×2 suggestion grid */}
      <View style={{ width: "100%", gap: 10 }}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <SuggestionPill icon={SUGGESTIONS[0].icon} text={SUGGESTIONS[0].text} onPress={() => onSuggestion(SUGGESTIONS[0].text)} colors={colors} accentPrimary={accentPrimary} />
          <SuggestionPill icon={SUGGESTIONS[1].icon} text={SUGGESTIONS[1].text} onPress={() => onSuggestion(SUGGESTIONS[1].text)} colors={colors} accentPrimary={accentPrimary} />
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <SuggestionPill icon={SUGGESTIONS[2].icon} text={SUGGESTIONS[2].text} onPress={() => onSuggestion(SUGGESTIONS[2].text)} colors={colors} accentPrimary={accentPrimary} />
          <SuggestionPill icon={SUGGESTIONS[3].icon} text={SUGGESTIONS[3].text} onPress={() => onSuggestion(SUGGESTIONS[3].text)} colors={colors} accentPrimary={accentPrimary} />
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SacredWisdomScreen() {
  const { colors, sp } = useThemeTokens();
  const insets       = useSafeAreaInsets();
  const { getToken } = useAuth();
  const reducedMotion = useReducedMotion();

  const accentPrimary = colors.primary as string;
  const accentGold    = colors.accentGold;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId,  setActiveConvId]  = useState<string | null>(null);
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [input,         setInput]         = useState("");
  const [streaming,     setStreaming]      = useState(false);
  const [historyOpen,   setHistoryOpen]   = useState(false);

  const listRef  = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load persisted conversations
  useEffect(() => {
    storageGet<Conversation[]>(CONV_STORAGE_KEY, []).then((convs) => {
      if (convs.length > 0) setConversations(convs);
    });
  }, []);

  // Auto-scroll when messages update
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: !reducedMotion }), 80);
    }
  }, [messages, reducedMotion]);

  // Flush conversation to storage
  const flushConversation = useCallback((msgs: Message[], convId: string) => {
    if (msgs.length === 0) return;
    setConversations((prev) => {
      const existing = prev.find((c) => c.id === convId);
      const updated: Conversation = existing
        ? { ...existing, messages: msgs, title: getConvTitle(msgs), updatedAt: Date.now() }
        : { id: convId, title: getConvTitle(msgs), messages: msgs, pinned: false, createdAt: Date.now(), updatedAt: Date.now() };
      const rest = prev.filter((c) => c.id !== convId);
      const all  = [updated, ...rest].slice(0, MAX_CONVERSATIONS);
      storageSet(CONV_STORAGE_KEY, all);
      return all;
    });
  }, []);

  // Send message + stream response
  const sendMessage = useCallback(async (text: string, prevMessages?: Message[], convId?: string) => {
    const txt = text.trim();
    if (!txt || streaming) return;

    const currentConvId = convId ?? activeConvId ?? genId();
    if (!activeConvId && !convId) setActiveConvId(currentConvId);

    const userMsg: Message = { id: genId(), role: "user", content: txt, timestamp: Date.now() };
    const base      = prevMessages ?? messages;
    const withUser  = [...base, userMsg];

    setMessages(withUser);
    setInput("");
    setStreaming(true);

    const assistantId  = genId();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", streaming: true, timestamp: Date.now() };
    setMessages([...withUser, assistantMsg]);

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated   = "";
    let providerFound: AiProvider | undefined;

    try {
      const token   = await getToken().catch(() => null);
      const apiMsgs = withUser.map(({ role, content }) => ({ role, content }));

      for await (const event of streamChat(apiMsgs, token, controller.signal)) {
        if (event.done) break;
        if (event.error) throw new Error(event.error);
        if (event.provider) providerFound = event.provider as AiProvider;
        if (event.text) {
          accumulated += event.text;
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, content: accumulated, provider: providerFound } : m),
          );
        }
      }

      const finalMsgs = withUser.concat({ id: assistantId, role: "assistant", content: accumulated, provider: providerFound, timestamp: Date.now() });
      setMessages(finalMsgs);
      flushConversation(finalMsgs, currentConvId);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        const partial = withUser.concat({ id: assistantId, role: "assistant", content: accumulated || "…", provider: providerFound, timestamp: Date.now() });
        setMessages(partial);
        flushConversation(partial, currentConvId);
      } else {
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, content: "I'm sorry — I couldn't reach the wisdom servers right now. Please try again.", streaming: false } : m),
        );
      }
    } finally {
      setStreaming(false);
      setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, streaming: false } : m));
      abortRef.current = null;
    }
  }, [streaming, activeConvId, messages, getToken, flushConversation]);

  const handleSend     = useCallback(() => sendMessage(input), [sendMessage, input]);
  const handleSuggest  = useCallback((text: string) => sendMessage(text), [sendMessage]);
  const handleStop     = useCallback(() => { abortRef.current?.abort(); }, []);
  const handleNewChat  = useCallback(() => {
    if (streaming) abortRef.current?.abort();
    const newId = genId();
    setActiveConvId(newId);
    setMessages([]);
    setInput("");
  }, [streaming]);

  const handleResume   = useCallback((conv: Conversation) => {
    setActiveConvId(conv.id);
    setMessages(conv.messages);
  }, []);

  const handleDelete   = useCallback((id: string) => {
    hapticLight();
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      storageSet(CONV_STORAGE_KEY, updated);
      return updated;
    });
    if (id === activeConvId) { setMessages([]); setActiveConvId(null); }
  }, [activeConvId]);

  const handlePin      = useCallback((id: string) => {
    setConversations((prev) => {
      const updated = prev.map((c) => c.id === id ? { ...c, pinned: !c.pinned } : c);
      storageSet(CONV_STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const renderItem = useCallback(({ item }: { item: Message }) => (
    <MessageBubble message={item} colors={colors} accentPrimary={accentPrimary} accentGold={accentGold} reducedMotion={reducedMotion} />
  ), [colors, accentPrimary, accentGold, reducedMotion]);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const isWeb   = Platform.OS === "web";
  const topPad  = (insets.top || 0) + (isWeb ? 67 : 0);
  const botPad  = Math.max(insets.bottom || 0, 8);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <View style={{
        paddingTop: topPad + 12, paddingBottom: 12, paddingHorizontal: 16,
        flexDirection: "row", alignItems: "center", gap: 10,
        backgroundColor: colors.background,
        borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
      }}>
        {/* Back */}
        <Pressable
          onPress={() => { if (streaming) abortRef.current?.abort(); router.back(); }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }}
        >
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>

        {/* Title */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontFamily: "Inter_700Bold", color: colors.textPrimary, letterSpacing: -0.3 }}>
            Rav Menashe
          </Text>
          {streaming && (
            <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: accentPrimary, marginTop: 1 }}>
              Composing wisdom…
            </Text>
          )}
        </View>

        {/* History */}
        <Pressable
          onPress={() => setHistoryOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="View conversation history"
          style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }}
        >
          <Feather name="clock" size={19} color={colors.textSecondary} />
          {conversations.length > 0 && (
            <View style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: 3.5, backgroundColor: accentPrimary }} />
          )}
        </Pressable>

        {/* New chat */}
        <Pressable
          onPress={handleNewChat}
          accessibilityRole="button"
          accessibilityLabel="Start new conversation"
          style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }}
        >
          <Feather name="edit-2" size={18} color={colors.textSecondary} />
        </Pressable>

        {/* Profile */}
        <Pressable
          onPress={() => router.push("/profile/edit")}
          accessibilityRole="button"
          accessibilityLabel="View profile"
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: accentPrimary + "18",
            borderWidth: 1, borderColor: accentPrimary + "30",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Feather name="user" size={17} color={accentPrimary} />
        </Pressable>
      </View>

      {/* ─── Chat area ───────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 20,
            flexGrow: 1,
            maxWidth: READING_MAX_WIDTH,
            width: "100%",
            alignSelf: "center",
          }}
          ListEmptyComponent={
            <EmptyState
              onSuggestion={handleSuggest}
              colors={colors}
              accentPrimary={accentPrimary}
              accentGold={accentGold}
            />
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS !== "web"}
          maxToRenderPerBatch={10}
          windowSize={8}
          initialNumToRender={20}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          accessibilityLabel="Conversation with Rav Menashe"
        />

        {/* ─── Input bar ───────────────────────────────────────────────── */}
        <View style={{
          backgroundColor: colors.background,
          borderTopWidth: 1, borderTopColor: colors.cardBorder,
          paddingHorizontal: 16, paddingTop: 12,
          paddingBottom: botPad + 12,
        }}>
          <View style={{
            flexDirection: "row", alignItems: "flex-end", gap: 10,
            backgroundColor: colors.card,
            borderRadius: 24,
            borderWidth: 1, borderColor: streaming ? accentPrimary + "40" : colors.cardBorder,
            paddingHorizontal: 16, paddingVertical: 8,
            maxWidth: READING_MAX_WIDTH, width: "100%", alignSelf: "center",
          }}>
            <TextInput
              ref={inputRef}
              value={input}
              onChangeText={setInput}
              placeholder="Ask Rav Menashe…"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={2000}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              blurOnSubmit={false}
              editable={!streaming}
              accessible
              accessibilityLabel="Message input"
              underlineColorAndroid="transparent"
              style={{
                flex: 1,
                color: colors.textPrimary,
                fontSize: 15,
                fontFamily: "Inter_400Regular",
                lineHeight: 22,
                maxHeight: 120,
                paddingVertical: 4,
                // Remove native focus ring on web and Android
                ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
              }}
            />
            {streaming ? (
              <Pressable
                onPress={handleStop}
                accessibilityRole="button"
                accessibilityLabel="Stop generating"
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <Feather name="square" size={14} color="#fff" />
              </Pressable>
            ) : (
              <Pressable
                onPress={handleSend}
                disabled={!input.trim()}
                accessibilityRole="button"
                accessibilityLabel="Send message"
                style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: input.trim() ? accentPrimary : colors.cardBorder,
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >
                <Feather name="arrow-up" size={16} color={input.trim() ? "#fff" : colors.textMuted} />
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ─── History modal ────────────────────────────────────────────────── */}
      <HistoryModal
        visible={historyOpen}
        conversations={conversations}
        onClose={() => setHistoryOpen(false)}
        onResume={handleResume}
        onDelete={handleDelete}
        onPin={handlePin}
        colors={colors}
        accentPrimary={accentPrimary}
        accentGold={accentGold}
        insets={insets}
      />
    </View>
  );
}
