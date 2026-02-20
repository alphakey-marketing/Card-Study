import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "com.flashmind.app",
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: clientId || "",
      scopes: ["openid", "profile", "email"],
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === "success") {
      const { access_token } = response.params;
      handleSignIn(access_token);
    } else if (response?.type === "error") {
      setError("Sign in was cancelled or failed. Please try again.");
      setLoading(false);
    }
  }, [response]);

  const handleSignIn = async (accessToken: string) => {
    setLoading(true);
    setError(null);
    try {
      await signIn(accessToken, "access");
    } catch (err) {
      setError("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = async () => {
    if (!clientId) {
      setError("Google sign-in is not configured yet.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await promptAsync();
    } catch {
      setError("Failed to start sign in.");
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + webTopInset + 60,
            paddingBottom: insets.bottom + webBottomInset + 40,
          },
        ]}
      >
        <Animated.View entering={FadeIn.duration(600)} style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="flash" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>FlashMind</Text>
          <Text style={styles.tagline}>
            Study smarter with flashcards
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          style={styles.bottomSection}
        >
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.googleButton,
              pressed && styles.googleButtonPressed,
              loading && styles.googleButtonDisabled,
            ]}
            onPress={handleGooglePress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.text} />
            ) : (
              <>
                <Image
                  source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.disclaimer}>
            Sign in to save your flashcards and sync across devices
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "space-between",
  },
  logoSection: {
    alignItems: "center",
    paddingTop: 60,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontFamily: "DMSans_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    fontFamily: "DMSans_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  bottomSection: {
    gap: 16,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.errorLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.error,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  googleButtonPressed: {
    backgroundColor: Colors.surfaceElevated,
    transform: [{ scale: 0.98 }],
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
  },
  disclaimer: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.textTertiary,
    textAlign: "center",
    lineHeight: 18,
  },
});
