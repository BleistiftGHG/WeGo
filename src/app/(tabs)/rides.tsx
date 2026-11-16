import { Button } from "@/components/Button";
import { radii, spacing } from "@/constants/theme";
import { useTheme } from "@/context/SettingsContext";
import { fetchNames } from "@/lib/names";
import {
  cancelRequest,
  fetchRequests,
  respondToRequest,
  type RideRequest,
} from "@/lib/requests";
import { supabase } from "@/lib/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Ride = {
  id: string;
  driver_id: string;
  origin_name: string;
  destination_name: string;
  departure_time: string;
  seats: number;
  note: string | null;
};

export default function Rides() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors, typography } = useTheme();
  const [rides, setRides] = useState<Ride[]>([]);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const { data: auth } = await supabase.auth.getUser();
    setUserId(auth.user?.id ?? null);

    const { data } = await supabase
      .from("rides")
      .select(
        "id, driver_id, origin_name, destination_name, departure_time, seats, note",
      )
      .gte("departure_time", new Date().toISOString())
      .order("departure_time", { ascending: true });
    const rideList = (data as Ride[]) ?? [];
    const requestList = await fetchRequests();

    setRides(rideList);
    setRequests(requestList);
    setNames(
      await fetchNames([
        ...rideList.map((r) => r.driver_id),
        ...requestList.map((q) => q.passenger_id),
      ]),
    );
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const run = async (action: () => Promise<boolean>) => {
    setFailed(false);
    const ok = await action();
    if (!ok) setFailed(true);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("rides").delete().eq("id", id);
    load();
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString(i18n.language, {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const myRides = rides.filter((r) => r.driver_id === userId);
  const myRequests = requests.filter((q) => q.passenger_id === userId);
  const joined = rides.filter((r) =>
    myRequests.some((q) => q.ride_id === r.id && q.status !== "cancelled"),
  );

  const statusLabel = (status: RideRequest["status"]) =>
    status === "accepted"
      ? t("requests.accepted")
      : status === "declined"
        ? t("requests.declined")
        : t("requests.requested");

  const seatText = (seats: number) =>
    seats < 1 ? t("requests.full") : t("rides.seatsLeft", { count: seats });

  const cardStyle = [
    styles.card,
    { backgroundColor: colors.input, borderColor: colors.border },
  ];

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={load} />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.title, styles.title]}>{t("rides.title")}</Text>
        <Button
          label={t("rides.offer")}
          onPress={() => router.push("/offer")}
        />

        {failed ? (
          <Text style={typography.caption}>{t("requests.error")}</Text>
        ) : null}

        {myRides.length === 0 && joined.length === 0 ? (
          <Text style={[typography.caption, styles.empty]}>
            {t("rides.empty")}
          </Text>
        ) : null}

        {myRides.length > 0 ? (
          <Text style={[typography.heading, styles.section]}>
            {t("requests.driving")}
          </Text>
        ) : null}

        {myRides.map((ride) => {
          const forRide = requests.filter(
            (q) => q.ride_id === ride.id && q.passenger_id !== userId,
          );
          const pending = forRide.filter((q) => q.status === "pending");
          const confirmed = forRide.filter((q) => q.status === "accepted");

          return (
            <View key={ride.id} style={cardStyle}>
              <Text style={typography.body}>
                {ride.origin_name} → {ride.destination_name}
              </Text>
              <Text style={typography.caption}>
                {formatTime(ride.departure_time)} · {seatText(ride.seats)} ·{" "}
                {t("requests.confirmed", { count: confirmed.length })}
              </Text>
              {ride.note ? (
                <Text style={typography.caption}>{ride.note}</Text>
              ) : null}

              {confirmed.length > 0 ? (
                <Text style={typography.caption}>
                  {confirmed
                    .map(
                      (q, i) =>
                        names[q.passenger_id] ??
                        `${t("requests.passenger")} ${i + 1}`,
                    )
                    .join(", ")}
                </Text>
              ) : null}

              {pending.length === 0 ? (
                <Text style={typography.caption}>
                  {t("requests.noPending")}
                </Text>
              ) : (
                pending.map((q, index) => (
                  <View
                    key={q.id}
                    style={[styles.requestRow, { borderColor: colors.divider }]}
                  >
                    <Text style={[typography.body, styles.flex]}>
                      {names[q.passenger_id] ??
                        `${t("requests.passenger")} ${index + 1}`}
                    </Text>
                    <Pressable
                      onPress={() => run(() => respondToRequest(q.id, false))}
                      style={[styles.small, { borderColor: colors.border }]}
                    >
                      <Text style={typography.caption}>
                        {t("requests.decline")}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => run(() => respondToRequest(q.id, true))}
                      style={[
                        styles.small,
                        { backgroundColor: colors.surface },
                      ]}
                    >
                      <Text
                        style={[
                          typography.caption,
                          { color: colors.onSurface },
                        ]}
                      >
                        {t("requests.accept")}
                      </Text>
                    </Pressable>
                  </View>
                ))
              )}

              <Pressable onPress={() => remove(ride.id)} style={styles.delete}>
                <Text style={[typography.caption, { color: colors.text }]}>
                  {t("rides.delete")}
                </Text>
              </Pressable>
            </View>
          );
        })}

        {joined.length > 0 ? (
          <Text style={[typography.heading, styles.section]}>
            {t("requests.riding")}
          </Text>
        ) : null}

        {joined.map((ride) => {
          const mine = myRequests.find((q) => q.ride_id === ride.id);
          if (!mine) return null;
          const driver = names[ride.driver_id];
          return (
            <View key={ride.id} style={cardStyle}>
              <Text style={typography.body}>
                {ride.origin_name} → {ride.destination_name}
              </Text>
              <Text style={typography.caption}>
                {formatTime(ride.departure_time)}
                {driver ? ` · ${t("requests.driver")}: ${driver}` : ""}
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.text, fontWeight: "600" },
                ]}
              >
                {statusLabel(mine.status)}
              </Text>
              {mine.status === "pending" || mine.status === "accepted" ? (
                <Pressable
                  onPress={() => run(() => cancelRequest(mine.id))}
                  style={styles.delete}
                >
                  <Text style={[typography.caption, { color: colors.text }]}>
                    {t("requests.cancel")}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  title: { marginTop: spacing.md },
  section: { marginTop: spacing.md },
  empty: { textAlign: "center", marginTop: spacing.lg },
  card: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  small: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  delete: { alignSelf: "flex-start", paddingVertical: spacing.xs },
});
