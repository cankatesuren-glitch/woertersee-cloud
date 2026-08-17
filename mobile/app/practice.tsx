import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  answerPracticeCard, ApiError, finishPractice, getVocabulary, replayPractice, reviewPractice,
  startPractice, type DeckOptions, type GameResult, type GameSession,
  type VocabularyCategory, type VocabularyWord,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

type DeckMode = "quick" | "category" | "words";
type State = { kind: "builder" | "loading" } | { kind: "playing"; game: GameSession; index: number } |
  { kind: "complete"; game: GameSession } | { kind: "error"; message: string };

export default function PracticeScreen() {
  const auth = useAuth();
  const [state, setState] = useState<State>({ kind: "builder" });
  const [categories, setCategories] = useState<VocabularyCategory[]>([]);
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [catalogueError, setCatalogueError] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getVocabulary().then((data) => { setCategories(data.categories); setWords(data.words); })
      .catch((error) => setCatalogueError(messageFor(error)));
  }, []);

  async function token() {
    const value = await auth.getAccessToken();
    if (!value) throw new ApiError("Your session has expired. Please connect your account again.");
    return value;
  }

  async function begin(options: DeckOptions) {
    setState({ kind: "loading" });
    setRevealed(false);
    try {
      const game = await startPractice(await token(), options);
      if (!game.cards.length) throw new ApiError("There are no words available for this deck.");
      setState({ kind: "playing", game, index: 0 });
    } catch (error) { setState({ kind: "error", message: messageFor(error) }); }
  }

  async function answer(result: GameResult) {
    if (state.kind !== "playing" || saving) return;
    setSaving(true);
    try {
      const accessToken = await token();
      const current = state.game.cards[state.index];
      const game = await answerPracticeCard(accessToken, state.game.id, current.id, result);
      if (state.index + 1 >= game.cards.length) {
        setState({ kind: "complete", game: await finishPractice(accessToken, game.id) });
      } else {
        setState({ kind: "playing", game, index: state.index + 1 });
        setRevealed(false);
      }
    } catch (error) { setState({ kind: "error", message: messageFor(error) }); }
    finally { setSaving(false); }
  }

  async function finish() {
    if (state.kind !== "playing" || saving) return;
    setSaving(true);
    try { setState({ kind: "complete", game: await finishPractice(await token(), state.game.id) }); }
    catch (error) { setState({ kind: "error", message: messageFor(error) }); }
    finally { setSaving(false); }
  }

  async function continueWith(action: "review" | "replay", game: GameSession) {
    setState({ kind: "loading" });
    try {
      const accessToken = await token();
      const next = action === "review" ? await reviewPractice(accessToken, game.id) : await replayPractice(accessToken, game.id);
      setRevealed(false);
      setState({ kind: "playing", game: next, index: 0 });
    } catch (error) { setState({ kind: "error", message: messageFor(error) }); }
  }

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
    <View style={s.top}><Pressable onPress={() => router.back()}><Text style={s.back}>← Today</Text></Pressable>
      {state.kind === "playing" && <Pressable disabled={saving} onPress={finish}><Text style={s.finish}>Finish session</Text></Pressable>}
    </View>
    {state.kind === "builder" && <Builder categories={categories} words={words} error={catalogueError} start={begin} />}
    {state.kind === "loading" && <ActivityIndicator style={s.loader} color="#bd5b3d" />}
    {state.kind === "playing" && <Round state={state} revealed={revealed} saving={saving} reveal={() => setRevealed(!revealed)} answer={answer} />}
    {state.kind === "complete" && <Results game={state.game} next={continueWith} another={() => setState({ kind: "builder" })} />}
    {state.kind === "error" && <Panel label="PRACTICE PAUSED" title="That deck did not load." copy={state.message} action="Back to deck builder" onPress={() => setState({ kind: "builder" })} />}
  </ScrollView></SafeAreaView>;
}

function Builder({ categories, words, error, start }: { categories: VocabularyCategory[]; words: VocabularyWord[]; error: string; start: (o: DeckOptions) => void }) {
  const [mode, setMode] = useState<DeckMode>("quick");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [wordIds, setWordIds] = useState<string[]>([]);
  const [cardCount, setCardCount] = useState(10);
  const [direction, setDirection] = useState<DeckOptions["direction"]>("DE_EN");
  const [ordering, setOrdering] = useState<DeckOptions["ordering"]>("RANDOM");
  const [unseenOnly, setUnseenOnly] = useState(false);
  const [search, setSearch] = useState("");
  const visible = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    return (q ? words.filter((w) => `${w.german} ${w.english}`.toLocaleLowerCase().includes(q)) : words).slice(0, 100);
  }, [search, words]);
  const toggle = (id: string, values: string[], update: (v: string[]) => void) => update(values.includes(id) ? values.filter((v) => v !== id) : [...values, id]);
  const enabled = mode === "quick" || (mode === "category" ? !!categoryIds.length : !!wordIds.length);

  return <>
    <Text style={s.eyebrow}>BUILD A DECK</Text><Text style={s.title}>What do you want to practise?</Text>
    <View style={s.tabs}><Tab active={mode === "quick"} label="Quick" press={() => setMode("quick")} /><Tab active={mode === "category"} label="Categories" press={() => setMode("category")} /><Tab active={mode === "words"} label="Pick words" press={() => setMode("words")} /></View>
    <View style={s.builder}>
      {mode === "quick" && <><Text style={s.optionTitle}>Smart review mix</Text><Text style={s.copy}>Words due today come first, followed by new material.</Text><View style={s.switchRow}><View style={{ flex: 1 }}><Text style={s.optionTitle}>New words only</Text><Text style={s.copy}>Skip scheduled reviews.</Text></View><Switch value={unseenOnly} onValueChange={setUnseenOnly} trackColor={{ true: "#87a591" }} /></View></>}
      {mode === "category" && <View style={s.list}>{categories.map((c) => <Choice key={c.id} selected={categoryIds.includes(c.id)} title={c.name} subtitle={`${c.wordCount} words`} press={() => toggle(c.id, categoryIds, setCategoryIds)} />)}</View>}
      {mode === "words" && <><TextInput accessibilityLabel="Search words" placeholder="Search German or English" placeholderTextColor="#87918d" value={search} onChangeText={setSearch} style={s.search} /><Text style={s.count}>{wordIds.length} selected · showing {visible.length}</Text><View style={s.list}>{visible.map((w) => <Choice key={w.id} selected={wordIds.includes(w.id)} title={w.german} subtitle={w.english} disabled={!wordIds.includes(w.id) && wordIds.length >= 100} press={() => toggle(w.id, wordIds, setWordIds)} />)}</View></>}
      <Label text="CARDS" /><View style={s.row}>{[5, 10, 20].map((n) => <Chip key={n} active={cardCount === n} label={`${n}`} disabled={mode === "words"} press={() => setCardCount(n)} />)}{mode === "words" && <Text style={s.count}>{wordIds.length} selected</Text>}</View>
      <Label text="DIRECTION" /><View style={s.row}><Chip active={direction === "DE_EN"} label="German → English" press={() => setDirection("DE_EN")} /><Chip active={direction === "EN_DE"} label="English → German" press={() => setDirection("EN_DE")} /></View>
      <Label text="ORDER" /><View style={s.row}><Chip active={ordering === "RANDOM"} label="Random" press={() => setOrdering("RANDOM")} /><Chip active={ordering === "AZ"} label="A–Z" press={() => setOrdering("AZ")} /></View>
      {!!error && <Text style={s.error}>{error}</Text>}
      <Pressable disabled={!enabled} style={[s.primary, !enabled && s.disabled]} onPress={() => start({ wordIds: mode === "words" ? wordIds : [], categoryIds: mode === "category" ? categoryIds : [], cardCount: mode === "words" ? wordIds.length : cardCount, direction, ordering, unseenOnly: mode === "quick" && unseenOnly })}><Text style={s.primaryText}>Start deck →</Text></Pressable>
    </View>
  </>;
}

function Tab({ active, label, press }: { active: boolean; label: string; press: () => void }) { return <Pressable onPress={press} style={[s.tab, active && s.tabActive]}><Text style={[s.tabText, active && s.tabTextActive]}>{label}</Text></Pressable>; }
function Chip({ active, label, press, disabled = false }: { active: boolean; label: string; press: () => void; disabled?: boolean }) { return <Pressable disabled={disabled} onPress={press} style={[s.chip, active && s.chipActive, disabled && s.disabled]}><Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text></Pressable>; }
function Label({ text }: { text: string }) { return <Text style={s.label}>{text}</Text>; }
function Choice({ selected, title, subtitle, press, disabled = false }: { selected: boolean; title: string; subtitle: string; press: () => void; disabled?: boolean }) { return <Pressable disabled={disabled} onPress={press} style={[s.choice, selected && s.choiceActive, disabled && s.disabled]}><View style={[s.check, selected && s.checkActive]}><Text style={s.checkText}>{selected ? "✓" : ""}</Text></View><View style={{ flex: 1 }}><Text style={s.optionTitle}>{title}</Text><Text style={s.copy}>{subtitle}</Text></View></Pressable>; }

function Round({ state, revealed, saving, reveal, answer }: { state: Extract<State, { kind: "playing" }>; revealed: boolean; saving: boolean; reveal: () => void; answer: (r: GameResult) => void }) {
  const card = state.game.cards[state.index];
  const english = state.game.direction === "DE_EN" ? revealed : !revealed;
  return <><Text style={s.eyebrow}>PRACTICE</Text><View style={s.progressRow}><View style={s.track}><View style={[s.fill, { width: `${((state.index + 1) / state.game.cards.length) * 100}%` }]} /></View><Text style={s.count}>{state.index + 1} / {state.game.cards.length}</Text></View>
    <Pressable onPress={reveal} style={[s.flashcard, revealed && s.revealed]}><Text style={s.eyebrow}>{revealed ? "TRANSLATION" : state.game.direction === "DE_EN" ? "GERMAN" : "ENGLISH"}</Text><Text style={s.word}>{revealed ? card.back : card.front}</Text>{english && card.forms.length === 3 && <Text style={s.forms}>Präteritum: {card.forms[1]} · Perfekt: {card.forms[2]}</Text>}<Text style={s.hint}>{revealed ? "Tap to see the first side" : "Tap to reveal"}</Text></Pressable>
    {revealed ? <View style={s.answerRow}><Pressable disabled={saving} onPress={() => answer("DIFFICULT")} style={[s.answer, s.notYet]}><Text style={s.notYetText}>Not yet</Text></Pressable><Pressable disabled={saving} onPress={() => answer("KNOWN")} style={[s.answer, s.gotIt]}><Text style={s.primaryText}>{saving ? "Saving…" : "Got it"}</Text></Pressable></View> : <Text style={s.instruction}>Think of the translation, then tap the card.</Text>}
  </>;
}

function Results({ game, next, another }: { game: GameSession; next: (a: "review" | "replay", g: GameSession) => void; another: () => void }) { return <View style={s.panel}><Text style={s.eyebrow}>SESSION COMPLETE</Text><Text style={s.title}>{game.accuracy?.toFixed(0) ?? "—"}% remembered</Text><View style={s.stats}><Stat value={game.answered} label="answered" /><Stat value={game.known} label="got it" /><Stat value={game.difficult} label="not yet" /></View><Pressable disabled={!game.difficult} onPress={() => next("review", game)} style={[s.primary, !game.difficult && s.disabled]}><Text style={s.primaryText}>Review my mistakes</Text></Pressable><Pressable onPress={() => next("replay", game)} style={s.secondary}><Text style={s.secondaryText}>Replay original deck</Text></Pressable><Pressable onPress={another} style={s.textButton}><Text style={s.back}>Build another deck</Text></Pressable></View>; }
function Stat({ value, label }: { value: number; label: string }) { return <View style={{ alignItems: "center", flex: 1 }}><Text style={s.statValue}>{value}</Text><Text style={s.count}>{label}</Text></View>; }
function Panel({ label, title, copy, action, onPress }: { label: string; title: string; copy: string; action: string; onPress: () => void }) { return <View style={s.panel}><Text style={s.eyebrow}>{label}</Text><Text style={s.title}>{title}</Text><Text style={s.error}>{copy}</Text><Pressable onPress={onPress} style={s.primary}><Text style={s.primaryText}>{action}</Text></Pressable></View>; }
function messageFor(error: unknown) { return error instanceof ApiError ? error.message : "Practice could not be loaded. Check that the local services are running."; }

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f0e4" }, page: { flexGrow: 1, padding: 24, paddingTop: 18, paddingBottom: 50 }, top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }, back: { color: "#173b38", fontSize: 16, fontWeight: "700" }, finish: { color: "#9a431f", fontSize: 15, fontWeight: "700" }, loader: { marginTop: 180 },
  eyebrow: { color: "#bd5b3d", fontSize: 12, fontWeight: "800", letterSpacing: 2 }, title: { color: "#173b38", fontFamily: "Georgia", fontSize: 34, lineHeight: 40, marginTop: 12 }, tabs: { backgroundColor: "#e6dfd2", borderRadius: 14, flexDirection: "row", marginTop: 22, padding: 4 }, tab: { alignItems: "center", borderRadius: 11, flex: 1, paddingVertical: 11 }, tabActive: { backgroundColor: "#fffdf8" }, tabText: { color: "#687570", fontSize: 13, fontWeight: "700" }, tabTextActive: { color: "#173b38" },
  builder: { backgroundColor: "#fffdf8", borderColor: "#ded5c4", borderRadius: 24, borderWidth: 1, marginTop: 18, padding: 20 }, optionTitle: { color: "#173b38", fontSize: 15, fontWeight: "700" }, copy: { color: "#63716d", fontSize: 13, lineHeight: 19, marginTop: 3 }, switchRow: { alignItems: "center", borderTopColor: "#e8e1d6", borderTopWidth: 1, flexDirection: "row", marginTop: 18, paddingTop: 18 },
  list: { gap: 9 }, choice: { alignItems: "center", borderColor: "#ded5c4", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 12, padding: 12 }, choiceActive: { backgroundColor: "#edf3ed", borderColor: "#87a591" }, check: { alignItems: "center", borderColor: "#9ba5a0", borderRadius: 6, borderWidth: 1, height: 22, justifyContent: "center", width: 22 }, checkActive: { backgroundColor: "#173b38", borderColor: "#173b38" }, checkText: { color: "#fff", fontWeight: "800" },
  search: { backgroundColor: "#f7f3eb", borderColor: "#ded5c4", borderRadius: 14, borderWidth: 1, color: "#173b38", fontSize: 15, marginBottom: 10, padding: 14 }, count: { color: "#63716d", fontSize: 12, marginVertical: 5 }, label: { color: "#9a431f", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginTop: 24, marginBottom: 9 }, row: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 8 }, chip: { borderColor: "#cfc6b7", borderRadius: 99, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 }, chipActive: { backgroundColor: "#173b38", borderColor: "#173b38" }, chipText: { color: "#52645f", fontSize: 13, fontWeight: "700" }, chipTextActive: { color: "#fffdf8" }, disabled: { opacity: 0.35 },
  primary: { alignItems: "center", backgroundColor: "#173b38", borderRadius: 16, marginTop: 24, paddingVertical: 17 }, primaryText: { color: "#fffdf8", fontSize: 16, fontWeight: "700" }, secondary: { alignItems: "center", borderColor: "#173b38", borderRadius: 16, borderWidth: 1, marginTop: 12, paddingVertical: 16 }, secondaryText: { color: "#173b38", fontSize: 16, fontWeight: "700" }, textButton: { alignItems: "center", marginTop: 16, padding: 8 },
  progressRow: { alignItems: "center", flexDirection: "row", gap: 12, marginTop: 18 }, track: { backgroundColor: "#e1dacd", borderRadius: 99, flex: 1, height: 8, overflow: "hidden" }, fill: { backgroundColor: "#e7a442", borderRadius: 99, height: 8 }, flashcard: { alignItems: "center", backgroundColor: "#fffdf8", borderColor: "#ded5c4", borderRadius: 28, borderWidth: 1, justifyContent: "center", marginTop: 30, minHeight: 390, padding: 30, shadowColor: "#173b38", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 22 }, revealed: { backgroundColor: "#edf3ed", borderColor: "#c7d7ca" }, word: { color: "#173b38", fontFamily: "Georgia", fontSize: 42, lineHeight: 49, marginTop: 20, textAlign: "center" }, forms: { color: "#52645f", fontSize: 15, lineHeight: 22, marginTop: 18, textAlign: "center" }, hint: { color: "#7f8985", fontSize: 13, marginTop: 28 },
  answerRow: { flexDirection: "row", gap: 12, marginTop: 22 }, answer: { alignItems: "center", borderRadius: 16, flex: 1, paddingVertical: 17 }, notYet: { backgroundColor: "#fffdf8", borderColor: "#bd5b3d", borderWidth: 1 }, notYetText: { color: "#9a431f", fontSize: 16, fontWeight: "700" }, gotIt: { backgroundColor: "#173b38" }, instruction: { color: "#63716d", fontSize: 14, marginTop: 22, textAlign: "center" }, panel: { backgroundColor: "#fffdf8", borderColor: "#ded5c4", borderRadius: 24, borderWidth: 1, marginTop: 45, padding: 24 }, stats: { flexDirection: "row", marginTop: 28 }, statValue: { color: "#173b38", fontFamily: "Georgia", fontSize: 30 }, error: { color: "#9a431f", fontSize: 14, lineHeight: 21, marginTop: 16 },
});
