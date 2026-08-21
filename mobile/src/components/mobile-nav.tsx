import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

const items = [
  { path: "/", icon: "⌂", label: "Today" },
  { path: "/practice", icon: "◆", label: "Practice" },
  { path: "/create", icon: "+", label: "Create" },
  { path: "/words", icon: "A", label: "My Words" },
  { path: "/progress", icon: "↗", label: "Progress" },
  { path: "/settings", icon: "⚙", label: "Settings" },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  return <View style={styles.nav}>{items.map((item) => {
    const active = pathname === item.path;
    return <Pressable accessibilityRole="button" key={item.path} onPress={() => router.replace(item.path)} style={styles.item}>
      <Text style={[styles.icon, active && styles.active]}>{item.icon}</Text>
      <Text numberOfLines={1} style={[styles.label, active && styles.active]}>{item.label}</Text>
    </Pressable>;
  })}</View>;
}

const styles = StyleSheet.create({
  nav: { backgroundColor: "#fffdf8", borderTopColor: "#ded5c4", borderTopWidth: 1, bottom: 0, flexDirection: "row", left: 0, paddingBottom: 9, paddingHorizontal: 8, paddingTop: 9, position: "absolute", right: 0 },
  item: { alignItems: "center", flex: 1, gap: 3 }, icon: { color: "#7b8883", fontSize: 19, fontWeight: "700" }, label: { color: "#7b8883", fontSize: 9, fontWeight: "700" }, active: { color: "#9a431f" },
});
