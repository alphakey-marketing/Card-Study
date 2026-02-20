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
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Colors from "@/constants/colors";
import { FlashcardSet, Flashcard, getSet, updateKnownCards } from "@/lib/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function SwipeCard({
  card,
  onSwipeLeft,
  onSwipeRight,
  isTop,
}: {
  card: Flashcard;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const flipRotation = useSharedValue(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = useCallback(() => {
    const target = isFlipped ? 0 : 180;
    flipRotation.value = withTiming(target, {
      duration: 400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    setIsFlipped(!isFlipped);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isFlipped]);

  const frontAnimStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipRotation.value, [0, 180], [0, 180]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      backfaceVisibility: "hidden" as const,
      opacity: interpolate(flipRotation.value, [0, 89, 90, 180], [1, 1, 0, 0]),
    };
  });

  const backAnimStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipRotation.value, [0, 180], [180, 360]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      backfaceVisibility: "hidden" as const,
      opacity: interpolate(flipRotation.value, [0, 89, 90, 180], [0, 0, 1, 1]),
    };
  });

  const panGesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.3;
      rotation.value = interpolate(
        event.translationX,
        [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
        [-15, 0, 15]
      );
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 });
        rotation.value = withTiming(20, { duration: 300 });
        runOnJS(onSwipeRight)();
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 });
        rotation.value = withTiming(-20, { duration: 300 });
        runOnJS(onSwipeLeft)();
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
        rotation.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(handleFlip)();
  });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const knowOverlay = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const dontKnowOverlay = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  if (!isTop) {
    return (
      <View style={[styles.swipeCard, styles.swipeCardBack]}>
        <Animated.View style={[styles.cardFace, styles.cardFaceFront, frontAnimStyle]}>
          <Text style={styles.swipeCardLabel}>TERM</Text>
          <Text style={styles.swipeCardText}>{card.front}</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.swipeCard, cardStyle]}>
        <Animated.View style={[styles.cardFace, styles.cardFaceFront, frontAnimStyle]}>
          <Animated.View style={[styles.swipeOverlay, styles.knowOverlay, knowOverlay]}>
            <Text style={styles.overlayText}>KNOW IT</Text>
          </Animated.View>
          <Animated.View style={[styles.swipeOverlay, styles.dontKnowOverlay, dontKnowOverlay]}>
            <Text style={styles.overlayTextDont}>STILL LEARNING</Text>
          </Animated.View>
          <Text style={styles.swipeCardLabel}>TERM</Text>
          <Text style={styles.swipeCardText}>{card.front}</Text>
          <View style={styles.swipeHint}>
            <Feather name="rotate-cw" size={14} color={Colors.textTertiary} />
            <Text style={styles.swipeHintText}>Tap to flip</Text>
          </View>
        </Animated.View>
        <Animated.View style={[styles.cardFace, styles.cardFaceBack, backAnimStyle]}>
          <Animated.View style={[styles.swipeOverlay, styles.knowOverlay, knowOverlay]}>
            <Text style={styles.overlayText}>KNOW IT</Text>
          </Animated.View>
          <Animated.View style={[styles.swipeOverlay, styles.dontKnowOverlay, dontKnowOverlay]}>
            <Text style={styles.overlayTextDont}>STILL LEARNING</Text>
          </Animated.View>
          <Text style={styles.swipeCardLabelBack}>DEFINITION</Text>
          <Text style={styles.swipeCardTextBack}>{card.back}</Text>
          <View style={styles.swipeHint}>
            <Feather name="rotate-cw" size={14} color="rgba(255,255,255,0.5)" />
            <Text style={[styles.swipeHintText, { color: "rgba(255,255,255,0.5)" }]}>
              Tap to flip
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

function ResultsScreen({
  knownCount,
  totalCount,
  onRestart,
  onGoBack,
}: {
  knownCount: number;
  totalCount: number;
  onRestart: () => void;
  onGoBack: () => void;
}) {
  const percentage = Math.round((knownCount / totalCount) * 100);
  const insets = useSafeAreaInsets();
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={styles.resultsContainer}>
      <View style={styles.resultsContent}>
        <View style={styles.resultCircle}>
          <Text style={styles.resultPercentage}>{percentage}%</Text>
        </View>
        <Text style={styles.resultsTitle}>
          {percentage >= 80
            ? "Great job!"
            : percentage >= 50
            ? "Keep going!"
            : "Keep practicing!"}
        </Text>
        <Text style={styles.resultsSubtitle}>
          You knew {knownCount} out of {totalCount} cards
        </Text>

        <View style={styles.resultsBars}>
          <View style={styles.resultBar}>
            <View style={styles.resultBarHeader}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.know} />
              <Text style={styles.resultBarLabel}>Know it</Text>
              <Text style={styles.resultBarCount}>{knownCount}</Text>
            </View>
            <View style={styles.resultBarTrack}>
              <View
                style={[
                  styles.resultBarFill,
                  {
                    width: `${(knownCount / totalCount) * 100}%`,
                    backgroundColor: Colors.know,
                  },
                ]}
              />
            </View>
          </View>
          <View style={styles.resultBar}>
            <View style={styles.resultBarHeader}>
              <Ionicons name="close-circle" size={18} color={Colors.dontKnow} />
              <Text style={styles.resultBarLabel}>Still learning</Text>
              <Text style={styles.resultBarCount}>
                {totalCount - knownCount}
              </Text>
            </View>
            <View style={styles.resultBarTrack}>
              <View
                style={[
                  styles.resultBarFill,
                  {
                    width: `${((totalCount - knownCount) / totalCount) * 100}%`,
                    backgroundColor: Colors.dontKnow,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.resultsActions, { paddingBottom: insets.bottom + webBottomInset + 20 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.restartButton,
            pressed && { transform: [{ scale: 0.97 }] },
          ]}
          onPress={onRestart}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.restartButtonText}>Try Again</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.goBackButton,
            pressed && { transform: [{ scale: 0.97 }] },
          ]}
          onPress={onGoBack}
        >
          <Text style={styles.goBackButtonText}>Back to Set</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function SwipeScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionKnown, setSessionKnown] = useState<string[]>([]);
  const [sessionDone, setSessionDone] = useState(false);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  useEffect(() => {
    (async () => {
      const data = await getSet(id);
      if (data) {
        setSet(data);
        setCards(shuffleArray(data.cards));
      }
      setLoading(false);
    })();
  }, [id]);

  const handleSwipeRight = useCallback(() => {
    if (!cards[currentIndex]) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSessionKnown((prev) => [...prev, cards[currentIndex].id]);
    setTimeout(() => {
      if (currentIndex >= cards.length - 1) {
        setSessionDone(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 300);
  }, [currentIndex, cards]);

  const handleSwipeLeft = useCallback(() => {
    if (!cards[currentIndex]) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const currentCard = cards[currentIndex];
    setCards((prev) => [...prev, { ...currentCard, id: `${currentCard.id}-retry-${Date.now()}` }]);
    
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 300);
  }, [currentIndex, cards]);

  const handleRestart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCards(shuffleArray(cards));
    setCurrentIndex(0);
    setSessionKnown([]);
    setSessionDone(false);
  }, [cards]);

  const handleGoBack = () => {
    router.back();
  };

  useEffect(() => {
    if (sessionDone && set) {
      const existingKnown = new Set(set.knownCardIds);
      sessionKnown.forEach((kid) => existingKnown.add(kid));
      updateKnownCards(set.id, Array.from(existingKnown));
    }
  }, [sessionDone]);

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
        <Text style={styles.emptyText}>No cards to review</Text>
      </View>
    );
  }

  if (sessionDone) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <ResultsScreen
          knownCount={sessionKnown.length}
          totalCount={cards.length}
          onRestart={handleRestart}
          onGoBack={handleGoBack}
        />
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
          <Text style={styles.headerTitle}>Swipe Review</Text>
          <Text style={styles.headerSubtitle}>
            {currentIndex + 1} / {cards.length}
          </Text>
        </View>
        <Pressable onPress={handleRestart} hitSlop={12}>
          <Ionicons name="shuffle" size={24} color={Colors.primary} />
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

      <View style={styles.swipeLabels}>
        <View style={styles.swipeLabelLeft}>
          <Ionicons name="close" size={16} color={Colors.dontKnow} />
          <Text style={[styles.swipeLabelText, { color: Colors.dontKnow }]}>
            Still learning
          </Text>
        </View>
        <View style={styles.swipeLabelRight}>
          <Text style={[styles.swipeLabelText, { color: Colors.know }]}>
            Know it
          </Text>
          <Ionicons name="checkmark" size={16} color={Colors.know} />
        </View>
      </View>

      <View style={styles.cardStack}>
        {cards.slice(currentIndex, currentIndex + 2).reverse().map((card, i) => {
          const isTop = i === (Math.min(cards.length - currentIndex, 2) - 1);
          return (
            <SwipeCard
              key={card.id}
              card={card}
              isTop={isTop}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
            />
          );
        })}
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
  swipeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  swipeLabelLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  swipeLabelRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  swipeLabelText: {
    fontSize: 13,
    fontFamily: "DMSans_600SemiBold",
  },
  cardStack: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  swipeCard: {
    position: "absolute",
    width: SCREEN_WIDTH - 48,
    maxWidth: 380,
    aspectRatio: 3 / 4,
    maxHeight: 450,
  },
  swipeCardBack: {
    transform: [{ scale: 0.95 }],
    opacity: 0.5,
  },
  cardFace: {
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
  cardFaceFront: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  cardFaceBack: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  swipeCardLabel: {
    position: "absolute",
    top: 24,
    left: 28,
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  swipeCardLabelBack: {
    position: "absolute",
    top: 24,
    left: 28,
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  swipeCardText: {
    fontSize: 22,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 32,
  },
  swipeCardTextBack: {
    fontSize: 20,
    fontFamily: "DMSans_500Medium",
    color: "#fff",
    textAlign: "center",
    lineHeight: 30,
  },
  swipeHint: {
    position: "absolute",
    bottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  swipeHintText: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.textTertiary,
  },
  swipeOverlay: {
    position: "absolute",
    top: 20,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    zIndex: 10,
  },
  knowOverlay: {
    right: 20,
    borderWidth: 2,
    borderColor: Colors.know,
    backgroundColor: Colors.knowLight,
  },
  dontKnowOverlay: {
    left: 20,
    borderWidth: 2,
    borderColor: Colors.dontKnow,
    backgroundColor: Colors.dontKnowLight,
  },
  overlayText: {
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    color: Colors.know,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  overlayTextDont: {
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    color: Colors.dontKnow,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  resultsContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  resultsContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  resultCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  resultPercentage: {
    fontSize: 36,
    fontFamily: "DMSans_700Bold",
    color: Colors.primary,
  },
  resultsTitle: {
    fontSize: 24,
    fontFamily: "DMSans_700Bold",
    color: Colors.text,
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 16,
    fontFamily: "DMSans_400Regular",
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  resultsBars: {
    width: "100%",
    gap: 16,
  },
  resultBar: {
    gap: 8,
  },
  resultBarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resultBarLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    color: Colors.text,
  },
  resultBarCount: {
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    color: Colors.text,
  },
  resultBarTrack: {
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    overflow: "hidden",
  },
  resultBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  resultsActions: {
    paddingHorizontal: 24,
    gap: 12,
  },
  restartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
  },
  restartButtonText: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: "#fff",
  },
  goBackButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
  },
  goBackButtonText: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
  },
});
