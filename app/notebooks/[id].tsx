import React, { useState, useCallback } from "react";
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
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import {
  Note,
  Notebook,
  getAllNotes,
  getNotebook,
  deleteNote,
  getNotePreview,
  formatDate,
} from "@/lib/notes-storage";

function NoteCard({
  note,
  index,
  onDelete,
}: {
  note: Note;
  index: number;
  onDelete: (id: string) => void;
}) {
  const preview = getNotePreview(note);
  const taskCount = note.tasks.length;
  const completedTasks = note.tasks.filter((t) => t.completed).length;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
      <Pressable
        style={({ pressed }) => [
          styles.noteCard,
          pressed && styles.noteCardPressed,
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: "/notes/[id]", params: { id: note.id } });
        }}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Alert.alert("Delete Note", `Delete "${note.title || "Untitled"}"?`, [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => onDelete(note.id),
            },
          ]);
        }}
      >
        <View style={styles.noteCardHeader}>
          <Text style={styles.noteCardTitle} numberOfLines={1}>
            {note.title || "Untitled"}
          </Text>
          <Text style={styles.noteDate}>{formatDate(note.updatedAt)}</Text>
        </View>
        <Text style={styles.notePreview} numberOfLines={2}>
          {preview}
        </Text>
        {note.tags.length > 0 || taskCount > 0 ? (
          <View style={styles.noteCardFooter}>
            {note.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tagBadge}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {taskCount > 0 ? (
              <View style={styles.taskBadge}>
                <Ionicons
                  name={completedTasks === taskCount ? "checkmark-circle" : "ellipse-outline"}
                  size={12}
                  color={completedTasks === taskCount ? Colors.success : Colors.textTertiary}
                />
                <Text style={styles.taskText}>
                  {completedTasks}/{taskCount}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export default function NotebookDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const loadData = useCallback(async () => {
    try {
      const [nb, allNotes] = await Promise.all([
        getNotebook(id),
        getAllNotes(),
      ]);
      setNotebook(nb);
      setNotes(allNotes.filter((n) => n.notebookId === id));
    } catch {
      setNotes([]);
    }
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadData();
    } catch {
      Alert.alert("Error", "Failed to delete note.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + webTopInset + 12 },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          {notebook ? (
            <View style={styles.headerTitleRow}>
              <View style={[styles.headerDot, { backgroundColor: notebook.color }]} />
              <Text style={styles.headerTitle}>{notebook.name}</Text>
            </View>
          ) : (
            <Text style={styles.headerTitle}>Notebook</Text>
          )}
          <Text style={styles.headerSubtitle}>
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/notes/create");
          }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {!loading && notes.length === 0 ? (
        <View style={styles.emptyState}>
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.emptyContent}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="document-text-outline" size={48} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No notes in this notebook</Text>
            <Text style={styles.emptyText}>
              Create a note and assign it to this notebook
            </Text>
          </Animated.View>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <NoteCard note={item} index={index} onDelete={handleDelete} />
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
          scrollEnabled={!!notes.length}
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.textSecondary,
    marginTop: 1,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonPressed: {
    backgroundColor: Colors.primaryDark,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  noteCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteCardPressed: {
    backgroundColor: Colors.surfaceElevated,
    transform: [{ scale: 0.98 }],
  },
  noteCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  noteCardTitle: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  noteDate: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.textTertiary,
  },
  notePreview: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  noteCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  tagBadge: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    color: Colors.textSecondary,
  },
  taskBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  taskText: {
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    color: Colors.textSecondary,
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
