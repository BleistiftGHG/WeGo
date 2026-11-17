import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { radii, spacing } from "@/constants/theme";
import { useTheme } from "@/context/SettingsContext";
import {
  fetchMessages,
  fetchRide,
  sendMessage,
  type ChatRide,
  type Message,
} from "@/lib/chat";
import { fetchNames } from "@/lib/names";
import { supabase } from "@/lib/supabase";

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { colors, typography, isDark } = useTheme();

  const [ride, setRide] = useState<ChatRide | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const knownSenders = useRef(new Set<string>());

  const addMessage = useCallback((m: Message) => {
    setMessages((prev) =>
      prev.some((x) => x.id === m.id) ? prev : [m, ...prev],
    );
  }, []);

  const loadNames = useCallback(async (senderIds: string[]) => {
    const missing = senderIds.filter((s) => !knownSenders.current.has(s));
    if (missing.length === 0) return;
    missing.forEach((s) => knownSenders.current.add(s));
    const found = await fetchNames(missing);
    setNames((prev) => ({ ...prev, ...found }));
  }, []);

  useEffect(() => {
    if (!id) return;
    let active = true;

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (active) setUserId(auth.user?.id ?? null);

      const [rideData, list] = await Promise.all([
        fetchRide(id),
        fetchMessages(id),
      ]);
      if (!active) return;
      setRide(rideData);
      setMessages(list);
      loadNames([
        ...(rideData ? [rideData.driver_id] : []),
        ...list.map((m) => m.sender_id),
      ]);
    })();

    const channel = supabase
      .channel(`chat-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `ride_id=eq.${id}`,
        },
        (payload) => {
          const m = payload.new as Message;
          addMessage(m);
          loadNames([m.sender_id]);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [id, addMessage, loadNames]);

  const send = async () => {
    const body = text.trim();
    if (!body || !userId || !id || sending) return;
    setSending(true);
    setFailed(false);
    const sent = await sendMessage(id, userId, body);
    setSending(false);
    if (sent) {
      addMessage(sent);
      setText("");
    } else {
      setFailed(true);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(i18n.language, {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
      <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}
    >
      <FlatList
        data={messages}
        inverted
        keyExtractor={(m) => m.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[typography.caption, styles.empty]}>
            {t("chat.empty")}
          </Text>
        }
        ListFooterComponent={
          <View style={styles.header}>
            {ride ? (
              <>
                <Text style={typography.heading}>
                  {ride.origin_name} → {ride.destination_name}
                </Text>
                <Text style={typography.caption}>
                  {new Date(ride.departure_time).toLocaleString(i18n.language, {
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const own = item.sender_id === userId;
          return (
            <View style={[styles.row, own ? styles.rowOwn : styles.rowOther]}>
              {!own ? (
                <Text style={[typography.caption, styles.sender]}>
                  {names[item.sender_id] ?? t("chat.someone")}
                </Text>
              ) : null}
              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor: own ? colors.surface : colors.input,
                    borderColor: colors.border,
                    borderWidth: own ? 0 : StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.body,
                    { color: own ? colors.onSurface : colors.text },
                  ]}
                >
                  {item.body}
                </Text>
              </View>
              <Text style={[typography.caption, styles.time]}>
                {formatTime(item.created_at)}
              </Text>
            </View>
          );
        }}
      />

      {failed ? (
        <Text style={[typography.caption, styles.error]}>
          {t("chat.sendError")}
        </Text>
      ) : null}

      <View
        style={[
          styles.composer,
          {
            borderTopColor: colors.divider,
            backgroundColor: colors.background,
            paddingBottom: Math.max(insets.bottom, spacing.xs),
          },
        ]}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t("chat.placeholder")}
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={1000}
          style={[
            styles.input,
            { backgroundColor: colors.input, color: colors.text },
          ]}
          keyboardAppearance={isDark ? "dark" : "light"}
        />
        <Pressable
          accessibilityLabel={t("chat.send")}
          onPress={send}
          disabled={!text.trim() || sending}
          style={[
            styles.sendBtn,
            {
              backgroundColor: colors.surface,
              opacity: !text.trim() || sending ? 0.35 : 1,
            },
          ]}
        >
          <Ionicons name="arrow-up" size={20} color={colors.onSurface} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.md, gap: spacing.sm },
  header: { paddingTop: spacing.md, paddingBottom: spacing.md, gap: spacing.xs },
  empty: {
    textAlign: "center",
    transform: [{ scaleY: -1 }],
    marginTop: spacing.lg,
  },
  row: { maxWidth: "80%", gap: 2 },
  rowOwn: { alignSelf: "flex-end", alignItems: "flex-end" },
  rowOther: { alignSelf: "flex-start", alignItems: "flex-start" },
  sender: { marginLeft: spacing.xs },
  time: { marginHorizontal: spacing.xs, fontSize: 11 },
  bubble: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
  },
  error: { textAlign: "center", paddingVertical: spacing.xs },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
