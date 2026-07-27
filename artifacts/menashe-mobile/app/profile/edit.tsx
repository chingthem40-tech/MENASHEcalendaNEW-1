/**
 * Edit Profile Screen — matches web ProfileModal fields exactly.
 * Fields: avatar/photo · displayName · congregation · role · country · city · bio
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { useAuth, useUser } from "@clerk/expo";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeTokens } from "@/src/mobile/design-system";
import { useLanguage } from "@/context/LanguageContext";
import { fetchPublicProfile, savePublicProfile, type PublicProfile } from "@/lib/profileApi";

// ── Constants ──────────────────────────────────────────────────────────────────
const ROLES = [
  "Member", "Community Leader", "Rabbi", "Cantor",
  "Youth Leader", "Women's Group", "Student", "Elder", "Admin",
];
const COUNTRIES = [
  "India", "Israel", "United States", "United Kingdom",
  "Australia", "Canada", "Other",
];
const AVATAR_EMOJIS = [
  "👤","🧑","👨","👩","🧔","👴","👵","🧕","👳",
  "🎓","✡","🌟","🙏","📖","🕍","🌿",
];

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "?";
}
function avatarBg(name: string): string {
  const cols = ["#1a3050","#2a1a40","#1a2a20","#30200a","#1a1a30","#2a1030","#0f2030","#301020"];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % cols.length;
  return cols[h];
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function EditProfileScreen() {
  const { colors, rd, shadow } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { t } = useLanguage();

  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [error,          setError]          = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [showEmojiPicker,setShowEmojiPicker]= useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showCountryPicker,setShowCountryPicker] = useState(false);

  const [form, setForm] = useState<PublicProfile>({
    displayName:    "",
    congregation:   "",
    bio:            "",
    role:           "Member",
    city:           "",
    country:        "India",
    avatarEmoji:    "👤",
    profilePhotoUrl:null,
  });

  // Load existing profile
  useEffect(() => {
    fetchPublicProfile(getToken).then((profile) => {
      if (profile) {
        setForm(profile);
      } else if (user) {
        setForm(f => ({ ...f, displayName: user.fullName ?? user.firstName ?? "" }));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function set<K extends keyof PublicProfile>(key: K, val: PublicProfile[K]) {
    setForm(f => ({ ...f, [key]: val }));
    setSaved(false);
    setError("");
  }

  // Pick photo from library
  const handlePickPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.82,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) { setError("Failed to read image. Please try another."); return; }
    if ((asset.fileSize ?? 0) > 5 * 1024 * 1024) {
      setError(t.profilePhotoTooBig);
      return;
    }
    setPhotoUploading(true);
    try {
      const dataUrl = `data:image/jpeg;base64,${asset.base64}`;
      set("profilePhotoUrl", dataUrl);
    } catch {
      setError("Failed to process image. Please try another.");
    } finally {
      setPhotoUploading(false);
    }
  }, [t.profilePhotoTooBig]);

  function handleRemovePhoto() {
    set("profilePhotoUrl", null);
    setShowEmojiPicker(false);
  }

  async function handleSave() {
    if (!form.displayName.trim()) { setError(t.profileNameRequired); return; }
    setError("");
    setSaving(true);
    try {
      await savePublicProfile(form, getToken);
      setSaved(true);
      setTimeout(() => router.back(), 1000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Derived values ───────────────────────────────────────────────────────────
  const gold       = colors.primary;
  const bg         = colors.background;
  const card       = colors.card;
  const border     = colors.border;
  const text       = colors.foreground;
  const textMuted  = colors.mutedForeground;
  const hasPhoto   = !!form.profilePhotoUrl;
  const avatarName = form.displayName || "?";

  // ── Inline components ────────────────────────────────────────────────────────
  function SectionLabel({ label }: { label: string }) {
    return (
      <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 1.4,
        textTransform: "uppercase", color: textMuted, marginBottom: 6 }}>
        {label}
      </Text>
    );
  }

  function PickerRow({
    label, value, onPress,
  }: { label: string; value: string; onPress: () => void }) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={[ss.input, {
          backgroundColor: card, borderColor: border,
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        }]}
      >
        <Text style={{ fontSize: 14, color: text }}>{value}</Text>
        <Feather name="chevron-down" size={15} color={textMuted} />
      </TouchableOpacity>
    );
  }

  // Generic option-list modal (Role / Country)
  function OptionModal({
    visible, title, options, selected, onSelect, onClose,
  }: {
    visible: boolean; title: string; options: string[];
    selected: string; onSelect: (v: string) => void; onClose: () => void;
  }) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable style={ss.modalOverlay} onPress={onClose}>
          <View style={[ss.modalSheet, { backgroundColor: card, borderColor: border }]}>
            {/* Handle */}
            <View style={[ss.handle, { backgroundColor: border }]} />
            <Text style={{ fontSize: 17, fontWeight: "700", color: text,
              textAlign: "center", marginBottom: 16 }}>{title}</Text>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {options.map(opt => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => { onSelect(opt); onClose(); }}
                  style={[ss.optionRow, {
                    borderColor: border,
                    backgroundColor: selected === opt ? gold + "14" : "transparent",
                  }]}
                >
                  <Text style={{ fontSize: 15, color: selected === opt ? gold : text, fontWeight: selected === opt ? "700" : "400" }}>
                    {opt}
                  </Text>
                  {selected === opt && <Feather name="check" size={16} color={gold} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Stack.Screen
        options={{
          title: t.profileTitle,
          headerStyle: { backgroundColor: bg },
          headerTintColor: gold,
          headerTitleStyle: { fontWeight: "700", color: text },
          headerShadowVisible: false,
          headerBackTitle: "",
        }}
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={gold} size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: (insets.bottom || 0) + 40, paddingTop: 20 }}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Avatar / Photo ─────────────────────────────────────────── */}
          <View style={{ alignItems: "center", marginBottom: 28 }}>
            {/* Circle */}
            <TouchableOpacity
              onPress={handlePickPhoto}
              activeOpacity={0.8}
              style={{ position: "relative", marginBottom: 12 }}
            >
              <View style={{
                width: 96, height: 96, borderRadius: 48,
                backgroundColor: hasPhoto ? "transparent" : avatarBg(avatarName),
                borderWidth: 2.5, borderColor: gold + "55",
                alignItems: "center", justifyContent: "center",
                overflow: "hidden",
              }}>
                {photoUploading ? (
                  <ActivityIndicator color={gold} />
                ) : hasPhoto ? (
                  <Image
                    source={{ uri: form.profilePhotoUrl! }}
                    style={{ width: 96, height: 96 }}
                    resizeMode="cover"
                  />
                ) : form.avatarEmoji === "👤" ? (
                  <Text style={{ fontSize: 34, fontWeight: "800", color: text }}>
                    {initials(avatarName)}
                  </Text>
                ) : (
                  <Text style={{ fontSize: 46 }}>{form.avatarEmoji}</Text>
                )}
              </View>

              {/* Camera badge */}
              <View style={{
                position: "absolute", bottom: 2, right: 2,
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: gold,
                alignItems: "center", justifyContent: "center",
                borderWidth: 2, borderColor: bg,
              }}>
                <Feather name="camera" size={13} color="#000" />
              </View>
            </TouchableOpacity>

            {/* Photo actions */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={handlePickPhoto}
                disabled={photoUploading}
                style={[ss.photoBtn, { borderColor: gold + "44", backgroundColor: gold + "10" }]}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: gold }}>
                  {photoUploading ? "Processing…" : hasPhoto ? t.profileChangePhoto : t.profileUploadPhoto}
                </Text>
              </TouchableOpacity>
              {hasPhoto && (
                <TouchableOpacity
                  onPress={handleRemovePhoto}
                  style={[ss.photoBtn, { borderColor: "#ef444444", backgroundColor: "#ef44440a" }]}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#ef4444" }}>
                    {t.profileRemovePhoto}
                  </Text>
                </TouchableOpacity>
              )}
              {!hasPhoto && (
                <TouchableOpacity
                  onPress={() => setShowEmojiPicker(v => !v)}
                  style={[ss.photoBtn, { borderColor: border, backgroundColor: card }]}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: textMuted }}>
                    {showEmojiPicker ? "Done" : "Choose Emoji"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={{ fontSize: 11, color: textMuted, marginTop: 6 }}>
              {t.profilePhotoHint}
            </Text>

            {/* Emoji picker */}
            {!hasPhoto && showEmojiPicker && (
              <View style={[ss.emojiGrid, { backgroundColor: card, borderColor: border }]}>
                <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.4,
                  textTransform: "uppercase", color: textMuted, marginBottom: 10 }}>
                  {t.profileChooseEmoji}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  {AVATAR_EMOJIS.map(e => (
                    <TouchableOpacity
                      key={e}
                      onPress={() => { set("avatarEmoji", e); setShowEmojiPicker(false); }}
                      style={{
                        width: 44, height: 44, borderRadius: 10,
                        backgroundColor: form.avatarEmoji === e ? gold + "18" : bg,
                        borderWidth: form.avatarEmoji === e ? 1.5 : 1,
                        borderColor: form.avatarEmoji === e ? gold + "55" : border,
                        alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                  {/* Initials option */}
                  <TouchableOpacity
                    onPress={() => { set("avatarEmoji", "👤"); setShowEmojiPicker(false); }}
                    style={{
                      paddingHorizontal: 12, height: 44, borderRadius: 10,
                      backgroundColor: form.avatarEmoji === "👤" ? gold + "18" : bg,
                      borderWidth: form.avatarEmoji === "👤" ? 1.5 : 1,
                      borderColor: form.avatarEmoji === "👤" ? gold + "55" : border,
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "700", color: textMuted }}>Initials</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* ── Form Fields ────────────────────────────────────────────── */}
          <View style={{ gap: 16 }}>

            {/* Display Name */}
            <View>
              <SectionLabel label={`${t.profileDisplayName} *`} />
              <TextInput
                value={form.displayName}
                onChangeText={v => set("displayName", v)}
                placeholder="Your full name"
                placeholderTextColor={textMuted}
                maxLength={60}
                returnKeyType="next"
                style={[ss.input, { backgroundColor: card, borderColor: border, color: text }]}
              />
            </View>

            {/* Congregation */}
            <View>
              <SectionLabel label={t.profileCongregation} />
              <TextInput
                value={form.congregation}
                onChangeText={v => set("congregation", v)}
                placeholder="e.g. Bnei Menashe Jerusalem"
                placeholderTextColor={textMuted}
                maxLength={80}
                returnKeyType="next"
                style={[ss.input, { backgroundColor: card, borderColor: border, color: text }]}
              />
            </View>

            {/* Role + Country (side by side) */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <SectionLabel label={t.profileRole} />
                <PickerRow label={t.profileRole} value={form.role} onPress={() => setShowRolePicker(true)} />
              </View>
              <View style={{ flex: 1 }}>
                <SectionLabel label={t.profileCountry} />
                <PickerRow label={t.profileCountry} value={form.country} onPress={() => setShowCountryPicker(true)} />
              </View>
            </View>

            {/* City */}
            <View>
              <SectionLabel label={t.profileCity} />
              <TextInput
                value={form.city}
                onChangeText={v => set("city", v)}
                placeholder="Your city"
                placeholderTextColor={textMuted}
                maxLength={60}
                returnKeyType="next"
                style={[ss.input, { backgroundColor: card, borderColor: border, color: text }]}
              />
            </View>

            {/* Bio */}
            <View>
              <SectionLabel label={t.profileBio} />
              <TextInput
                value={form.bio}
                onChangeText={v => set("bio", v)}
                placeholder={t.profileBioPlaceholder}
                placeholderTextColor={textMuted}
                maxLength={200}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={[ss.input, { backgroundColor: card, borderColor: border, color: text, height: 100, paddingTop: 10 }]}
              />
              <Text style={{ fontSize: 11, color: textMuted, textAlign: "right", marginTop: 4 }}>
                {form.bio.length}/200
              </Text>
            </View>
          </View>

          {/* ── Error ─────────────────────────────────────────────────── */}
          {!!error && (
            <View style={{
              marginTop: 14, padding: 12, borderRadius: 10,
              backgroundColor: "#ef44440a", borderWidth: 1, borderColor: "#ef444430",
            }}>
              <Text style={{ fontSize: 13, color: "#ef4444" }}>⚠️ {error}</Text>
            </View>
          )}

          {/* ── Save Button ────────────────────────────────────────────── */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || saved}
            activeOpacity={0.8}
            style={{
              marginTop: 24,
              backgroundColor: saved ? "#22c55e" : gold,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
              opacity: saving ? 0.75 : 1,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#000", letterSpacing: 0.2 }}>
              {saved ? t.profileSaved : saving ? t.profileSaving : t.profileSaveBtn}
            </Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 12, color: textMuted, textAlign: "center", marginTop: 10 }}>
            {t.profileVisibility}
          </Text>

        </ScrollView>
      )}

      {/* ── Option Modals ─────────────────────────────────────────────── */}
      <OptionModal
        visible={showRolePicker}
        title={t.profileRole}
        options={ROLES}
        selected={form.role}
        onSelect={v => set("role", v)}
        onClose={() => setShowRolePicker(false)}
      />
      <OptionModal
        visible={showCountryPicker}
        title={t.profileCountry}
        options={COUNTRIES}
        selected={form.country}
        onSelect={v => set("country", v)}
        onClose={() => setShowCountryPicker(false)}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  input: {
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14,
  },
  photoBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  emojiGrid: {
    marginTop: 14, padding: 14, borderRadius: 14, borderWidth: 1,
    alignItems: "center", width: "100%",
  },
  modalOverlay: {
    flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: {
    borderRadius: 20, borderWidth: 1, padding: 20,
    maxHeight: "75%",
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: "center", marginBottom: 16,
  },
  optionRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14, paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
