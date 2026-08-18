import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MobileNav } from "@/components/mobile-nav";
import { ApiError, getPersonalWords, type PersonalWord } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function WordsScreen() {
  const auth = useAuth(); const [words, setWords] = useState<PersonalWord[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = useCallback(async () => { setError(""); try { const token = await auth.getAccessToken(); if (!token) throw new ApiError("Connect your account to see your words."); setWords(await getPersonalWords(token)); } catch (e) { setError(e instanceof ApiError ? e.message : "Your words could not be loaded."); } finally { setLoading(false); } }, [auth]);
  useEffect(() => { void load(); }, [load]);
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}><Text style={s.eyebrow}>MY WORDS</Text><Text style={s.title}>Your own vocabulary.</Text><Text style={s.copy}>{words.length} saved words, ready whenever you are.</Text>{loading && <ActivityIndicator color="#bd5b3d" style={{ marginTop: 40 }} />}{!!error && <Text style={s.error}>{error}</Text>}<View style={s.list}>{words.map((word) => <View key={word.id} style={s.card}><Text style={s.german}>{word.german}</Text><Text style={s.english}>{word.english}{word.category ? ` · ${word.category}` : ""}</Text></View>)}</View>{!loading && !error && !words.length && <Text style={s.empty}>Add personal words on the website; they will appear here automatically.</Text>}</ScrollView><MobileNav /></SafeAreaView>;
}
const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: "#f6f0e4" }, page: { padding: 24, paddingTop: 42, paddingBottom: 110 }, eyebrow: { color: "#9a431f", fontSize: 12, fontWeight: "800", letterSpacing: 2 }, title: { color: "#173b38", fontFamily: "Georgia", fontSize: 40, lineHeight: 46, marginTop: 14 }, copy: { color: "#63716d", fontSize: 16, lineHeight: 24, marginTop: 12 }, list: { gap: 10, marginTop: 28 }, card: { backgroundColor: "#fffdf8", borderColor: "#ded5c4", borderRadius: 16, borderWidth: 1, padding: 16 }, german: { color: "#173b38", fontSize: 17, fontWeight: "700" }, english: { color: "#63716d", fontSize: 14, marginTop: 5 }, error: { color: "#9a431f", marginTop: 24 }, empty: { color: "#63716d", lineHeight: 22, marginTop: 30 } });
