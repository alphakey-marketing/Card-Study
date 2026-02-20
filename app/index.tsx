import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  Alert,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeIn,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { FlashcardSet, getAllSets, deleteSet } from "@/lib/storage";

function SetCard({
  set,
  index,
  onDelete,
}: {
  set: FlashcardSet;
  index: number;
  onDelete: (id: string) => void;
}) {
  const knownCount = set.knownCardIds.length;
  const totalCount = set.cards.length;
  const progress = totalCount > 0 ? knownCount / totalCount : 0;

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Set", `Are you sure you want to delete "${set.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete(set.id),
      },
    ]);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
      <Pressable
        style={({ pressed }) => [
          styles.setCard,
          pressed && styles.setCardPressed,
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: "/study/[id]", params: { id: set.id } });
        }}
        onLongPress={handleLongPress}
        testID={`set-card-${set.id}`}
      >
        <View style={styles.setCardHeader}>
          <View style={styles.setCardTitleRow}>
            <Text style={styles.setCardTitle} numberOfLines={1}>
              {set.title}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: "/edit/[id]", params: { id: set.id } });
              }}
              hitSlop={12}
            >
              <Feather name="edit-2" size={18} color={Colors.textSecondary} />
            </Pressable>
          </View>
          {set.description ? (
            <Text style={styles.setCardDesc} numberOfLines={2}>
              {set.description}
            </Text>
          ) : null}
        </View>

        <View style={styles.setCardFooter}>
          <View style={styles.cardCountBadge}>
            <Ionicons
              name="layers-outline"
              size={14}
              color={Colors.primary}
            />
            <Text style={styles.cardCountText}>
              {totalCount} {totalCount === 1 ? "card" : "cards"}
            </Text>
          </View>

          {totalCount > 0 ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${progress * 100}%` }]}
                />
              </View>
              <Text style={styles.progressText}>
                {knownCount}/{totalCount}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSets = useCallback(async () => {
    const data = await getAllSets();
    setSets(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSets();
    }, [loadSets])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSets();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    await deleteSet(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    loadSets();
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + webTopInset + 12 },
        ]}
      >
        <Animated.View entering={FadeIn.duration(500)}>
          <Text style={styles.headerTitle}>FlashMind</Text>
          <Text style={styles.headerSubtitle}>
            {sets.length > 0
              ? `${sets.length} ${sets.length === 1 ? "set" : "sets"}`
              : "Create your first set"}
          </Text>
        </Animated.View>
        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            pressed && styles.createButtonPressed,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/create");
          }}
          testID="create-set-button"
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {!loading && sets.length === 0 ? (
        <View style={styles.emptyState}>
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.emptyContent}>
            <View style={styles.emptyIconContainer}>
              <Ionicons
                name="albums-outline"
                size={48}
                color={Colors.textTertiary}
              />
            </View>
            <Text style={styles.emptyTitle}>No flashcard sets yet</Text>
            <Text style={styles.emptyText}>
              Tap the + button to create your first set of flashcards
            </Text>
          </Animated.View>
        </View>
      ) : (
        <FlatList
          data={sets}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <SetCard set={item} index={index} onDelete={handleDelete} />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + webBottomInset + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
          scrollEnabled={!!sets.length}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "DMSans_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  createButtonPressed: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 0.95 }],
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  setCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  setCardPressed: {
    backgroundColor: Colors.surfaceElevated,
    transform: [{ scale: 0.98 }],
  },
  setCardHeader: {
    marginBottom: 14,
  },
  setCardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  setCardTitle: {
    fontSize: 18,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  setCardDesc: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  setCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardCountText: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.primary,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.success,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    color: Colors.textTertiary,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyContent: {
    alignItems: "center",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
