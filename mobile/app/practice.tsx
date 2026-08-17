import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  answerPracticeCard,
  ApiError,
  finishPractice,
  type GameResult,
  type GameSession,
  startPractice,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

type PracticeState =
  | { kind: "loading" }
  | { kind: "playing"; game: GameSession; cardIndex: number }
  | { kind: "complete"; game: GameSession }
  | { kind: "error"; message: string };

export default function PracticeScreen() {
  const auth = useAuth();
  const [state, setState] = useState<PracticeState>({ kind: "loading" });
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);

  const begin = async () => {
    setState({ kind: "loading" });
    setRevealed(false);
    try {
      const token = await auth.getAccessToken();
      if (!token) {
        throw new ApiError("Your session has expired. Please connect your account again.");
      }
      const game = await startPractice(token);
      if (game.cards.length === 0) {
        throw new ApiError("There are no words available for this round.");
      }
      setState({ kind: "playing", game, cardIndex: 0 });
    } catch (error) {
      setState({ kind: "error", message: practiceError(error) });
    }
  };

  useEffect(() => {
    void begin();
  }, []);

  const answer = async (result: GameResult) => {
    if (state.kind !== "playing" || saving) return;
    const card = state.game.cards[state.cardIndex];
    setSaving(true);
    try {
      const token = await auth.getAccessToken();
      if (!token) throw new ApiError("Your session has expired.");
      const game = await answerPracticeCard(token, state.game.id, card.id, result);
      const nextIndex = state.cardIndex + 1;
      if (nextIndex >= game.cards.length) {
        const completed = await finishPractice(token, game.id);
        setState({ kind: "complete", game: completed });
      } else {
        setState({ kind: "playing", game, cardIndex: nextIndex });
        setRevealed(false);
      }
    } catch (error) {
      setState({ kind: "error", message: practiceError(error) });
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    if (state.kind !== "playing" || saving) return;
    setSaving(true);
    try {
      const token = await auth.getAccessToken();
      if (!token) throw new ApiError("Your session has expired.");
      const game = await finishPractice(token, state.game.id);
      setState({ kind: "complete", game });
    } catch (error) {
      setState({ kind: "error", message: practiceError(error) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Today</Text>
          </Pressable>
          {state.kind === "playing" ? (
            <Pressable accessibilityRole="button" disabled={saving} onPress={finish}>
              <Text style={styles.finishText}>Finish session</Text>
            </Pressable>
          ) : null}
        </View>

        {state.kind === "loading" ? <ActivityIndicator style={styles.loader} color="#bd5b3d" /> : null}
        {state.kind === "playing" ? (
          <PlayingRound
            state={state}
            revealed={revealed}
            saving={saving}
            reveal={() => setRevealed((value) => !value)}
            answer={answer}
          />
        ) : null}
        {state.kind === "complete" ? <Results game={state.game} /> : null}
        {state.kind === "error" ? <ErrorState message={state.message} retry={begin} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function PlayingRound({
  state,
  revealed,
  saving,
  reveal,
  answer,
}: {
  state: Extract<PracticeState, { kind: "playing" }>;
  revealed: boolean;
  saving: boolean;
  reveal: () => void;
  answer: (result: GameResult) => void;
}) {
  const card = state.game.cards[state.cardIndex];
  const progress = ((state.cardIndex + 1) / state.game.cards.length) * 100;

  return (
    <>
      <Text style={styles.eyebrow}>PRACTICE</Text>
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{state.cardIndex + 1} / {state.game.cards.length}</Text>
      </View>

      <Pressable
        accessibilityHint="Shows the other side of the card"
        accessibilityRole="button"
        onPress={reveal}
        style={[styles.flashcard, revealed && styles.flashcardRevealed]}
      >
        <Text style={styles.sideLabel}>{revealed ? "ENGLISH" : "GERMAN"}</Text>
        <Text style={styles.word}>{revealed ? card.back : card.front}</Text>
        {revealed && card.forms.length === 3 ? (
          <Text style={styles.forms}>Präteritum: {card.forms[1]} · Perfekt: {card.forms[2]}</Text>
        ) : null}
        <Text style={styles.tapHint}>Tap to {revealed ? "see German" : "reveal English"}</Text>
      </Pressable>

      {revealed ? (
        <View style={styles.answerRow}>
          <Pressable disabled={saving} onPress={() => answer("DIFFICULT")} style={[styles.answerButton, styles.notYetButton]}>
            <Text style={styles.notYetText}>Not yet</Text>
          </Pressable>
          <Pressable disabled={saving} onPress={() => answer("KNOWN")} style={[styles.answerButton, styles.gotItButton]}>
            <Text style={styles.gotItText}>{saving ? "Saving…" : "Got it"}</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.instruction}>Think of the English meaning, then tap the card.</Text>
      )}
    </>
  );
}

function Results({ game }: { game: GameSession }) {
  return (
    <View style={styles.resultsCard}>
      <Text style={styles.eyebrow}>SESSION COMPLETE</Text>
      <Text style={styles.resultsTitle}>A little progress adds up.</Text>
      <View style={styles.statRow}>
        <Stat value={game.answered} label="answered" />
        <Stat value={game.known} label="got it" />
        <Stat value={game.difficult} label="not yet" />
      </View>
      <Pressable onPress={() => router.replace("/")} style={styles.gotItButton}>
        <Text style={styles.gotItText}>Back to today</Text>
      </Pressable>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <View style={styles.resultsCard}>
      <Text style={styles.eyebrow}>PRACTICE PAUSED</Text>
      <Text style={styles.resultsTitle}>That round did not load.</Text>
      <Text style={styles.errorText}>{message}</Text>
      <Pressable onPress={retry} style={styles.gotItButton}><Text style={styles.gotItText}>Try again</Text></Pressable>
    </View>
  );
}

function practiceError(error: unknown) {
  return error instanceof ApiError ? error.message : "Practice could not be loaded. Check that the local services are running.";
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f6f0e4" },
  page: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 18, paddingBottom: 40 },
  topBar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 34 },
  backButton: { paddingVertical: 8 },
  backText: { color: "#173b38", fontSize: 16, fontWeight: "700" },
  finishText: { color: "#9a431f", fontSize: 15, fontWeight: "700" },
  loader: { marginTop: 180 },
  eyebrow: { color: "#bd5b3d", fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  progressRow: { alignItems: "center", flexDirection: "row", gap: 12, marginTop: 18 },
  progressTrack: { backgroundColor: "#e1dacd", borderRadius: 99, flex: 1, height: 8, overflow: "hidden" },
  progressFill: { backgroundColor: "#e7a442", borderRadius: 99, height: 8 },
  progressText: { color: "#63716d", fontSize: 13, fontWeight: "700" },
  flashcard: { alignItems: "center", backgroundColor: "#fffdf8", borderColor: "#ded5c4", borderRadius: 28, borderWidth: 1, justifyContent: "center", marginTop: 30, minHeight: 390, padding: 30, shadowColor: "#173b38", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 22 },
  flashcardRevealed: { backgroundColor: "#edf3ed", borderColor: "#c7d7ca" },
  sideLabel: { color: "#bd5b3d", fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  word: { color: "#173b38", fontFamily: "Georgia", fontSize: 42, lineHeight: 49, marginTop: 20, textAlign: "center" },
  forms: { color: "#52645f", fontSize: 15, lineHeight: 22, marginTop: 18, textAlign: "center" },
  tapHint: { color: "#7f8985", fontSize: 13, marginTop: 28 },
  answerRow: { flexDirection: "row", gap: 12, marginTop: 22 },
  answerButton: { alignItems: "center", borderRadius: 16, flex: 1, paddingVertical: 17 },
  notYetButton: { backgroundColor: "#fffdf8", borderColor: "#bd5b3d", borderWidth: 1 },
  notYetText: { color: "#9a431f", fontSize: 16, fontWeight: "700" },
  gotItButton: { alignItems: "center", backgroundColor: "#173b38", borderRadius: 16, marginTop: 22, paddingVertical: 17 },
  gotItText: { color: "#fffdf8", fontSize: 16, fontWeight: "700" },
  instruction: { color: "#63716d", fontSize: 14, lineHeight: 21, marginTop: 22, textAlign: "center" },
  resultsCard: { backgroundColor: "#fffdf8", borderColor: "#ded5c4", borderRadius: 24, borderWidth: 1, marginTop: 70, padding: 24 },
  resultsTitle: { color: "#173b38", fontFamily: "Georgia", fontSize: 34, lineHeight: 40, marginTop: 14 },
  statRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 30 },
  stat: { alignItems: "center", flex: 1 },
  statValue: { color: "#173b38", fontFamily: "Georgia", fontSize: 30 },
  statLabel: { color: "#63716d", fontSize: 12, marginTop: 4 },
  errorText: { color: "#63716d", fontSize: 16, lineHeight: 24, marginTop: 16 },
});
