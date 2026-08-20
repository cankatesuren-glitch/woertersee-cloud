import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MobileNav } from "@/components/mobile-nav";
import {
  ApiError, createPersonalWord, deletePersonalWord, getPersonalWords, type PersonalWord,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function WordsScreen() {
  const auth = useAuth();
  const [words, setWords] = useState<PersonalWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [german, setGerman] = useState("");
  const [english, setEnglish] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const accessToken = async () => {
    const token = await auth.getAccessToken();
    if (!token) throw new ApiError("Connect your account to manage your words.");
    return token;
  };

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setWords(await getPersonalWords(await accessToken())); }
    catch (e) { setError(messageFor(e)); }
    finally { setLoading(false); }
  }, [auth]);

  useEffect(() => { void load(); }, [load]);

  async function add() {
    if (!german.trim() || !english.trim() || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const created = await createPersonalWord(await accessToken(), {
        german: german.trim(), english: english.trim(), category: category.trim() || null,
        description: description.trim() || null,
      });
      setWords((current) => [created, ...current]);
      setGerman(""); setEnglish(""); setCategory(""); setDescription(""); setNotice("Word added to your collection.");
    } catch (e) { setError(messageFor(e)); }
    finally { setSaving(false); }
  }

  async function remove(word: PersonalWord) {
    if (saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await deletePersonalWord(await accessToken(), word.id);
      setWords((current) => current.filter((item) => item.id !== word.id));
      setNotice(`${word.german} removed.`);
    } catch (e) { setError(messageFor(e)); }
    finally { setSaving(false); }
  }

  const canAdd = german.trim().length > 0 && english.trim().length > 0 && !saving;
  return <SafeAreaView style={s.safe}>
    <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Text style={s.eyebrow}>MY WORDS</Text><Text style={s.title}>Your own vocabulary.</Text>
      <Text style={s.copy}>{words.length} saved words, ready whenever you are.</Text>
      <View style={s.form}>
        <Text style={s.formTitle}>Add a word</Text>
        <Field label="German" value={german} change={setGerman} placeholder="zum Beispiel: abfahren" />
        <Field label="English" value={english} change={setEnglish} placeholder="for example: to depart" />
        <Text style={s.fieldLabel}>Choose a category</Text>
        <View style={s.categoryRow}>{Array.from(new Set(words.map((word) => word.category).filter((value): value is string => Boolean(value)))).map((value) => <Pressable key={value} onPress={() => setCategory(value)} style={[s.categoryChip, category === value && s.categoryChipActive]}><Text style={[s.categoryText, category === value && s.categoryTextActive]}>{value}</Text></Pressable>)}</View>
        <Field label="Or create a category" value={category} change={setCategory} placeholder="Travel, Work, Verbs…" />
        <Field label="Description (optional)" value={description} change={setDescription} placeholder="A note, example or memory aid…" />
        <Pressable disabled={!canAdd} onPress={add} style={[s.primary, !canAdd && s.disabled]}><Text style={s.primaryText}>{saving ? "Saving…" : "Add word"}</Text></Pressable>
        {!!notice && <Text style={s.notice}>{notice}</Text>}{!!error && <Text style={s.error}>{error}</Text>}
      </View>
      {loading && <ActivityIndicator color="#bd5b3d" style={{ marginTop: 30 }} />}
      <View style={s.list}>{words.map((word) => <View key={word.id} style={s.card}><View style={{ flex: 1 }}><Text style={s.german}>{word.german}</Text><Text style={s.english}>{word.english}{word.category ? ` · ${word.category}` : ""}</Text>{word.description && <Text style={s.description}>{word.description}</Text>}</View><Pressable accessibilityLabel={`Remove ${word.german}`} disabled={saving} onPress={() => remove(word)} style={s.remove}><Text style={s.removeText}>Remove</Text></Pressable></View>)}</View>
      {!loading && !error && !words.length && <Text style={s.empty}>Your first personal word will appear here.</Text>}
    </ScrollView><MobileNav />
  </SafeAreaView>;
}

function Field({ label, value, change, placeholder }: { label: string; value: string; change: (v: string) => void; placeholder: string }) {
  return <View style={s.field}><Text style={s.fieldLabel}>{label}</Text><TextInput autoCapitalize="none" maxLength={255} onChangeText={change} placeholder={placeholder} placeholderTextColor="#8a938f" style={s.input} value={value} /></View>;
}
function messageFor(error: unknown) { return error instanceof ApiError ? error.message : "Your words could not be updated."; }

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f0e4" }, page: { padding: 24, paddingTop: 42, paddingBottom: 110 },
  eyebrow: { color: "#9a431f", fontSize: 12, fontWeight: "800", letterSpacing: 2 }, title: { color: "#173b38", fontFamily: "Georgia", fontSize: 40, lineHeight: 46, marginTop: 14 }, copy: { color: "#63716d", fontSize: 16, lineHeight: 24, marginTop: 12 },
  form: { backgroundColor: "#fffdf8", borderColor: "#ded5c4", borderRadius: 20, borderWidth: 1, marginTop: 24, padding: 18 }, formTitle: { color: "#173b38", fontFamily: "Georgia", fontSize: 25 }, field: { marginTop: 14 }, fieldLabel: { color: "#52645f", fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 14 }, input: { backgroundColor: "#f7f3eb", borderColor: "#d8d0c1", borderRadius: 12, borderWidth: 1, color: "#173b38", fontSize: 15, paddingHorizontal: 13, paddingVertical: 12 }, categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, categoryChip: { borderColor: "#cfc6b7", borderRadius: 99, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 7 }, categoryChipActive: { backgroundColor: "#173b38" }, categoryText: { color: "#52645f", fontSize: 12, fontWeight: "700" }, categoryTextActive: { color: "#fffdf8" },
  primary: { alignItems: "center", backgroundColor: "#173b38", borderRadius: 14, marginTop: 18, paddingVertical: 15 }, primaryText: { color: "#fffdf8", fontSize: 15, fontWeight: "700" }, disabled: { opacity: 0.35 }, notice: { color: "#3d7459", fontSize: 13, marginTop: 12, textAlign: "center" }, error: { color: "#9a431f", fontSize: 13, marginTop: 12, textAlign: "center" },
  list: { gap: 10, marginTop: 24 }, card: { alignItems: "center", backgroundColor: "#fffdf8", borderColor: "#ded5c4", borderRadius: 16, borderWidth: 1, flexDirection: "row", padding: 16 }, german: { color: "#173b38", fontSize: 17, fontWeight: "700" }, english: { color: "#63716d", fontSize: 14, marginTop: 5 }, description: { color: "#7b8883", fontSize: 13, fontStyle: "italic", lineHeight: 18, marginTop: 7 }, remove: { marginLeft: 12, padding: 8 }, removeText: { color: "#9a431f", fontSize: 12, fontWeight: "700" }, empty: { color: "#63716d", lineHeight: 22, marginTop: 30, textAlign: "center" },
});
