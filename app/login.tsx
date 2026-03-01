import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { signIn, user } = useAuth();
  const router = useRouter();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID",
  });

  useEffect(() => {
    if (response?.type === "success" && response.params.id_token) {
      signIn(response.params.id_token, "id");
    }
  }, [response]);

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Card Creator</Text>
      <Text style={styles.subtitle}>Sign in to sync your flashcards.</Text>
      <TouchableOpacity
        style={styles.button}
        disabled={!request}
        onPress={() => promptAsync()}
      >
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 30 },
  button: { backgroundColor: "#4285F4", padding: 15, borderRadius: 8 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});