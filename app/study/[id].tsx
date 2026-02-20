import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
  FadeIn,
  runOnJS,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { FlashcardSet, getSet, updateKnownCards, Flashcard } from "@/lib/storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function FlipCard({
  card,
  isFlipped,
  onFlip,
}: {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
}) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(isFlipped ? 180 : 0, {
      duration: 500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isFlipped]);

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 180], [0, 180]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: "hidden" as const,
      opacity: interpolate(rotation.value, [0, 89, 90, 180], [1, 1, 0, 0]),
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 180], [180, 360]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: "hidden" as const,
      opacity: interpolate(rotation.value, [0, 89, 90, 180], [0, 0, 1, 1]),
    };
  });

  return (
    <Pressable onPress={onFlip} style={styles.flipCardContainer}>
      <Animated.View style={[styles.flipCard, styles.flipCardFront, frontStyle]}>
        <Text style={styles.flipCardLabel}>TERM</Text>
        <Text style={styles.flipCardText}>{card.front}</Text>
        <View style={styles.flipHint}>
          <Feather name="rotate-cw" size={14} color={Colors.textTertiary} />
          <Text style={styles.flipHintText}>Tap to flip</Text>
        </View>
      </Animated.View>
      <Animated.View style={[styles.flipCard, styles.flipCardBack, backStyle]}>
        <Text style={styles.flipCardLabelBack}>DEFINITION</Text>
        <Text style={styles.flipCardTextBack}>{card.back}</Text>
        <View style={styles.flipHint}>
          <Feather name="rotate-cw" size={14} color="rgba(255,255,255,0.5)" />
          <Text style={[styles.flipHintText, { color: "rgba(255,255,255,0.5)" }]}>
            Tap to flip
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function StudyScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState<string[]>([]);

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  useEffect(() => {
    (async () => {
      const data = await getSet(id);
      if (data) {
        setSet(data);
        setCards(data.cards);
        setKnownIds(data.knownCardIds);
      }
      setLoading(false);
    })();
  }, [id]);

  const currentCard = cards[currentIndex];

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFlipped(!isFlipped);
  };

  const goToCard = (idx: number) => {
    setIsFlipped(false);
    setCurrentIndex(idx);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePrev = () => {
    if (currentIndex > 0) goToCard(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) goToCard(currentIndex + 1);
  };

  const handleShuffle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCards(shuffleArray(cards));
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleToggleKnown = async () => {
    if (!currentCard || !set) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let newKnown: string[];
    if (knownIds.includes(currentCard.id)) {
      newKnown = knownIds.filter((kid) => kid !== currentCard.id);
    } else {
      newKnown = [...knownIds, currentCard.id];
    }
    setKnownIds(newKnown);
    await updateKnownCards(set.id, newKnown);
  };

  const isCurrentKnown = currentCard
    ? knownIds.includes(currentCard.id)
    : false;

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!set || cards.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.emptyText}>No cards in this set</Text>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + webTopInset + 8 },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {set.title}
          </Text>
          <Text style={styles.headerSubtitle}>
            {currentIndex + 1} / {cards.length}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({ pathname: "/swipe/[id]", params: { id: set.id } });
          }}
          hitSlop={12}
        >
          <MaterialCommunityIcons
            name="cards-outline"
            size={24}
            color={Colors.primary}
          />
        </Pressable>
      </View>

      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${((currentIndex + 1) / cards.length) * 100}%`,
            },
          ]}
        />
      </View>

      <View style={styles.cardArea}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.cardWrapper}>
          <FlipCard
            key={currentCard.id}
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={handleFlip}
          />
        </Animated.View>
      </View>

      <View
        style={[
          styles.controls,
          { paddingBottom: insets.bottom + webBottomInset + 16 },
        ]}
      >
        <View style={styles.mainControls}>
          <Pressable
            onPress={handlePrev}
            style={[
              styles.navButton,
              currentIndex === 0 && styles.navButtonDisabled,
            ]}
            disabled={currentIndex === 0}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={currentIndex === 0 ? Colors.textTertiary : Colors.text}
            />
          </Pressable>

          <View style={styles.actionButtons}>
            <Pressable
              onPress={handleShuffle}
              style={styles.actionButton}
            >
              <Ionicons name="shuffle" size={22} color={Colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={handleToggleKnown}
              style={[
                styles.knownButton,
                isCurrentKnown && styles.knownButtonActive,
              ]}
            >
              <Ionicons
                name={isCurrentKnown ? "checkmark-circle" : "checkmark-circle-outline"}
                size={24}
                color={isCurrentKnown ? Colors.know : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.knownButtonText,
                  isCurrentKnown && styles.knownButtonTextActive,
                ]}
              >
                {isCurrentKnown ? "Known" : "Mark Known"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={handleNext}
            style={[
              styles.navButton,
              currentIndex === cards.length - 1 && styles.navButtonDisabled,
            ]}
            disabled={currentIndex === cards.length - 1}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={
                currentIndex === cards.length - 1
                  ? Colors.textTertiary
                  : Colors.text
              }
            />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Ionicons name="checkmark" size={14} color={Colors.know} />
            <Text style={styles.statText}>
              {knownIds.length} known
            </Text>
          </View>
          <View style={styles.statBadge}>
            <Ionicons name="help-outline" size={14} color={Colors.accent} />
            <Text style={styles.statText}>
              {cards.length - knownIds.length} learning
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "DMSans_500Medium",
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
    color: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: Colors.surface,
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.textSecondary,
    marginTop: 1,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: Colors.borderLight,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  cardArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  cardWrapper: {
    width: "100%",
    maxWidth: 400,
    aspectRatio: 3 / 4,
    maxHeight: 480,
  },
  flipCardContainer: {
    flex: 1,
    width: "100%",
  },
  flipCard: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    padding: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  flipCardFront: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  flipCardBack: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
  flipCardLabel: {
    position: "absolute",
    top: 24,
    left: 28,
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  flipCardLabelBack: {
    position: "absolute",
    top: 24,
    left: 28,
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  flipCardText: {
    fontSize: 22,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 32,
  },
  flipCardTextBack: {
    fontSize: 20,
    fontFamily: "DMSans_500Medium",
    color: "#fff",
    textAlign: "center",
    lineHeight: 30,
  },
  flipHint: {
    position: "absolute",
    bottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  flipHintText: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.textTertiary,
  },
  controls: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  mainControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  knownButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
  },
  knownButtonActive: {
    backgroundColor: Colors.knowLight,
  },
  knownButtonText: {
    fontSize: 13,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.textSecondary,
  },
  knownButtonTextActive: {
    color: Colors.know,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 12,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.textSecondary,
  },
});
