import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  Alert,
  TextInput,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import {
  Note,
  Notebook,
  getAllNotes,
  getAllNotebooks,
  deleteNote,
  searchNotes,
  getNotePreview,
  formatDate,
} from "@/lib/notes-storage";

function NoteCard({
  note,
  index,
  notebook,
  onDelete,
}: {
  note: Note;
  index: number;
  notebook: Notebook | null;
  onDelete: (id: string) => void;
}) {
  const preview = getNotePreview(note);
  const taskCount = note.tasks.length;
  const completedTasks = note.tasks.filter((t) => t.completed).length;

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Note", `Are you sure you want to delete "${note.title || "Untitled"}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete(note.id),
      },
    ]);
  };

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
        onLongPress={handleLongPress}
        testID={`note-card-${note.id}`}
      >
        <View style={styles.noteCardHeader}>
          <View style={styles.noteCardTitleRow}>
            {note.isPinned ? (
              <Ionicons name="pin" size={14} color={Colors.accent} style={{ marginRight: 4 }} />
            ) : null}
            <Text style={styles.noteCardTitle} numberOfLines={1}>
              {note.title || "Untitled"}
            </Text>
          </View>
          <Text style={styles.noteDate}>{formatDate(note.updatedAt)}</Text>
        </View>

        <Text style={styles.notePreview} numberOfLines={2}>
          {preview}
        </Text>

        <View style={styles.noteCardFooter}>
          {notebook ? (
            <View style={[styles.notebookBadge, { backgroundColor: notebook.color + "18" }]}>
              <View style={[styles.notebookDot, { backgroundColor: notebook.color }]} />
              <Text style={[styles.notebookBadgeText, { color: notebook.color }]}>
                {notebook.name}
              </Text>
            </View>
          ) : null}

          {note.tags.length > 0 ? (
            <View style={styles.tagRow}>
              {note.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.tagBadge}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

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
      </Pressable>
    </Animated.View>
  );
}

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState<Note[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const loadData = useCallback(async () => {
    try {
      const [allNotes, allNotebooks] = await Promise.all([
        getAllNotes(),
        getAllNotebooks(),
      ]);
      setNotes(allNotes);
      setNotebooks(allNotebooks);
    } catch {
      setNotes([]);
      setNotebooks([]);
    }
    setLoading(false);
  }, []);

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

  const handleDelete = async (id: string) => {
    try {
      await deleteNote(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadData();
    } catch {
      Alert.alert("Error", "Failed to delete note.");
    }
  };

  const getNotebookForNote = (note: Note): Notebook | null => {
    if (!note.notebookId) return null;
    return notebooks.find((nb) => nb.id === note.notebookId) ?? null;
  };

  const filteredNotes = searchQuery
    ? searchNotes(notes, searchQuery)
    : notes;

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + webTopInset + 12 },
        ]}
      >
        {showSearch ? (
          <Animated.View entering={FadeIn.duration(200)} style={styles.searchRow}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={18} color={Colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search notes, #tags, notebook:name..."
                placeholderTextColor={Colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
                </Pressable>
              ) : null}
            </View>
            <Pressable
              onPress={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
              hitSlop={12}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={FadeIn.duration(500)} style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Notes</Text>
              <Text style={styles.headerSubtitle}>
                {notes.length > 0
                  ? `${notes.length} ${notes.length === 1 ? "note" : "notes"}`
                  : "Create your first note"}
              </Text>
            </Animated.View>
            <View style={styles.headerRight}>
              <Pressable
                onPress={() => setShowSearch(true)}
                hitSlop={12}
                style={styles.iconButton}
              >
                <Ionicons name="search" size={22} color={Colors.textSecondary} />
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/notebooks/manage");
                }}
                hitSlop={12}
                style={styles.iconButton}
              >
                <Ionicons name="folder-outline" size={22} color={Colors.textSecondary} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.createButton,
                  pressed && styles.createButtonPressed,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("/notes/create");
                }}
                testID="create-note-button"
              >
                <Ionicons name="add" size={24} color="#fff" />
              </Pressable>
            </View>
          </>
        )}
      </View>

      {!loading && filteredNotes.length === 0 ? (
        <View style={styles.emptyState}>
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.emptyContent}>
            <View style={styles.emptyIconContainer}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color={Colors.textTertiary}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? "No results found" : "No notes yet"}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? "Try different search terms or filters"
                : "Tap the + button to create your first note"}
            </Text>
          </Animated.View>
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <NoteCard
              note={item}
              index={index}
              notebook={getNotebookForNote(item)}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
          scrollEnabled={!!filteredNotes.length}
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
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
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
  searchRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.text,
    height: 40,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
    color: Colors.primary,
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
  noteCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  noteCardTitle: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
    flex: 1,
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
  notebookBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  notebookDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  notebookBadgeText: {
    fontSize: 11,
    fontFamily: "DMSans_600SemiBold",
  },
  tagRow: {
    flexDirection: "row",
    gap: 4,
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
