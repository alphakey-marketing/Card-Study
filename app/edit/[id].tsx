import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  Alert,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Crypto from "expo-crypto";
import Animated, { FadeInDown } from "react-native-reanimated";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import Colors from "@/constants/colors";
import { getSet, saveSet, FlashcardSet } from "@/lib/storage";

interface CardDraft {
  id: string;
  front: string;
  back: string;
}

function CardEditor({
  card,
  index,
  onUpdate,
  onDelete,
  canDelete,
}: {
  card: CardDraft;
  index: number;
  onUpdate: (id: string, field: "front" | "back", value: string) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40).duration(300)}
      style={styles.cardEditor}
    >
      <View style={styles.cardEditorHeader}>
        <Text style={styles.cardNumber}>Card {index + 1}</Text>
        {canDelete ? (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onDelete(card.id);
            }}
            hitSlop={12}
          >
            <Feather name="trash-2" size={16} color={Colors.error} />
          </Pressable>
        ) : null}
      </View>
      <TextInput
        style={styles.cardInput}
        placeholder="Term / Question"
        placeholderTextColor={Colors.textTertiary}
        value={card.front}
        onChangeText={(v) => onUpdate(card.id, "front", v)}
        multiline
      />
      <View style={styles.cardDivider} />
      <TextInput
        style={styles.cardInput}
        placeholder="Definition / Answer"
        placeholderTextColor={Colors.textTertiary}
        value={card.back}
        onChangeText={(v) => onUpdate(card.id, "back", v)}
        multiline
      />
    </Animated.View>
  );
}

export default function EditScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState<CardDraft[]>([]);
  const [originalSet, setOriginalSet] = useState<FlashcardSet | null>(null);

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  useEffect(() => {
    (async () => {
      const set = await getSet(id);
      if (set) {
        setOriginalSet(set);
        setTitle(set.title);
        setDescription(set.description);
        setCards(
          set.cards.map((c) => ({
            id: c.id,
            front: c.front,
            back: c.back,
          }))
        );
      }
      setLoading(false);
    })();
  }, [id]);

  const handleAddCard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCards((prev) => [
      ...prev,
      { id: Crypto.randomUUID(), front: "", back: "" },
    ]);
  };

  const handleUpdateCard = (
    cardId: string,
    field: "front" | "back",
    value: string
  ) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, [field]: value } : c))
    );
  };

  const handleDeleteCard = (cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  const handleSave = async () => {
    Keyboard.dismiss();

    if (!title.trim()) {
      Alert.alert("Missing Title", "Please enter a title for your set.");
      return;
    }

    const validCards = cards.filter(
      (c) => c.front.trim() && c.back.trim()
    );

    if (validCards.length === 0) {
      Alert.alert(
        "No Cards",
        "Please add at least one card with both a term and definition."
      );
      return;
    }

    if (!originalSet) return;

    const updatedSet: FlashcardSet = {
      ...originalSet,
      title: title.trim(),
      description: description.trim(),
      cards: validCards.map((c) => ({
        id: c.id,
        front: c.front.trim(),
        back: c.back.trim(),
      })),
      updatedAt: Date.now(),
      knownCardIds: originalSet.knownCardIds.filter((kid) =>
        validCards.some((c) => c.id === kid)
      ),
    };

    await saveSet(updatedSet);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + webTopInset + 12 },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Set</Text>
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.saveButtonPressed,
          ]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + webBottomInset + 100 },
        ]}
        bottomOffset={60}
      >
        <View style={styles.metaSection}>
          <TextInput
            style={styles.titleInput}
            placeholder="Set Title"
            placeholderTextColor={Colors.textTertiary}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.descInput}
            placeholder="Description (optional)"
            placeholderTextColor={Colors.textTertiary}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.cardsSection}>
          <Text style={styles.sectionLabel}>
            Cards ({cards.length})
          </Text>
          {cards.map((card, index) => (
            <CardEditor
              key={card.id}
              card={card}
              index={index}
              onUpdate={handleUpdateCard}
              onDelete={handleDeleteCard}
              canDelete={cards.length > 1}
            />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.addCardButton,
            pressed && styles.addCardButtonPressed,
          ]}
          onPress={handleAddCard}
        >
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.addCardText}>Add Card</Text>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonPressed: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 0.96 }],
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  metaSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  titleInput: {
    fontSize: 20,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
    paddingVertical: 8,
  },
  descInput: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.text,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: 4,
  },
  cardsSection: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardEditor: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardEditorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardNumber: {
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardInput: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.text,
    paddingVertical: 8,
    minHeight: 40,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 2,
  },
  addCardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginTop: 12,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: "dashed",
  },
  addCardButtonPressed: {
    backgroundColor: Colors.primary,
  },
  addCardText: {
    fontSize: 15,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.primary,
  },
});
