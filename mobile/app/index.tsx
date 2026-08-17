import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError, getProgressDashboard, type DailyLearningGoal, type TodayPractice } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type ScreenState =
  | { kind: "loading" }
  | { kind: "signedOut" }
  | { kind: "ready"; today: TodayPractice; dailyGoal: DailyLearningGoal }
  | { kind: "error"; message: string };

export default function TodayScreen() {
  const auth = useAuth();
  const [state, setState] = useState<ScreenState>({ kind: "loading" });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const token = await auth.getAccessToken();
    if (!token) {
      setState({ kind: "signedOut" });
      return;
    }

    try {
      const dashboard = await getProgressDashboard(token);
      setState({ kind: "ready", today: dashboard.today, dailyGoal: dashboard.dailyGoal });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Your practice plan could not be loaded.";
      setState({ kind: "error", message });
    }
  }, [auth]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.page}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#bd5b3d" />}
      >
        <Text style={styles.eyebrow}>WÖRTERSEE</Text>
        <Text style={styles.heading}>A little German, every day.</Text>
        <Text style={styles.intro}>Your next practice is ready when you are.</Text>

        {state.kind === "loading" && <ActivityIndicator style={styles.loader} color="#bd5b3d" />}
        {state.kind === "signedOut" && <SignedOutCard loading={auth.loading} error={auth.error} signIn={auth.signIn} />}
        {state.kind === "ready" && <PracticeCard today={state.today} dailyGoal={state.dailyGoal} />}
        {state.kind === "error" && <ErrorCard message={state.message} retry={load} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function PracticeCard({ today, dailyGoal }: { today: TodayPractice; dailyGoal: DailyLearningGoal }) {
  const remaining = Math.max(dailyGoal.targetGames - dailyGoal.completedGames, 0);

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>TODAY</Text>
      <Text style={styles.cardTitle}>{remaining === 0 ? "Daily goal complete" : "Ready for a round?"}</Text>
      <Text style={styles.cardCopy}>
        {today.dueWords} due · {today.newWords} new · {dailyGoal.completedGames} games completed
      </Text>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(dailyGoal.percentage, 100)}%` },
          ]}
        />
      </View>
      <Pressable accessibilityRole="button" style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>{remaining === 0 ? "Review more words" : "Start practice"}</Text>
      </Pressable>
    </View>
  );
}

function SignedOutCard({ loading, error, signIn }: { loading: boolean; error?: string; signIn: () => Promise<void> }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>WELCOME</Text>
      <Text style={styles.cardTitle}>Bring your progress with you.</Text>
      <Text style={styles.cardCopy}>Connect your WörterSee account to see today’s words and learning streak.</Text>
      <Pressable accessibilityRole="button" disabled={loading} onPress={signIn} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>{loading ? "Connecting…" : "Connect account"}</Text>
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Text style={styles.note}>Sign-in opens securely in your browser and returns you to WörterSee.</Text>
    </View>
  );
}

function ErrorCard({ message, retry }: { message: string; retry: () => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>NOT CONNECTED</Text>
      <Text style={styles.cardTitle}>Let’s try that again.</Text>
      <Text style={styles.cardCopy}>{message}</Text>
      <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={retry}>
        <Text style={styles.secondaryButtonText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f6f0e4" },
  page: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 42, paddingBottom: 40 },
  eyebrow: { color: "#9a431f", fontSize: 12, fontWeight: "800", letterSpacing: 2.4 },
  heading: { color: "#173b38", fontFamily: "Georgia", fontSize: 44, lineHeight: 49, marginTop: 18, maxWidth: 330 },
  intro: { color: "#52645f", fontSize: 17, lineHeight: 25, marginTop: 14, marginBottom: 34 },
  loader: { marginTop: 64 },
  card: { backgroundColor: "#fffdf8", borderColor: "#ded5c4", borderRadius: 24, borderWidth: 1, padding: 24, shadowColor: "#173b38", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20 },
  cardLabel: { color: "#bd5b3d", fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  cardTitle: { color: "#173b38", fontFamily: "Georgia", fontSize: 28, lineHeight: 34, marginTop: 12 },
  cardCopy: { color: "#63716d", fontSize: 16, lineHeight: 24, marginTop: 12 },
  progressTrack: { backgroundColor: "#e4e8df", borderRadius: 99, height: 8, marginTop: 24, overflow: "hidden" },
  progressFill: { backgroundColor: "#e7a442", borderRadius: 99, height: 8 },
  primaryButton: { alignItems: "center", backgroundColor: "#173b38", borderRadius: 16, marginTop: 24, paddingVertical: 17 },
  primaryButtonText: { color: "#fffdf8", fontSize: 16, fontWeight: "700" },
  secondaryButton: { alignItems: "center", borderColor: "#173b38", borderRadius: 16, borderWidth: 1, marginTop: 24, paddingVertical: 16 },
  secondaryButtonText: { color: "#173b38", fontSize: 16, fontWeight: "700" },
  note: { color: "#7f8985", fontSize: 13, lineHeight: 19, marginTop: 14, textAlign: "center" },
  errorText: { color: "#9a431f", fontSize: 14, lineHeight: 20, marginTop: 14, textAlign: "center" },
});
