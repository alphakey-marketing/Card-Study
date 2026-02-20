import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import {
  Notebook,
  Note,
  getAllNotebooks,
  getAllNotes,
  saveNotebook,
  deleteNotebook,
  createNewNotebook,
  getNotebookTree,
  getRandomColor,
} from "@/lib/notes-storage";

function NotebookRow({
  notebook,
  noteCount,
  children,
  level,
  onEdit,
  onDelete,
  onPress,
}: {
  notebook: Notebook;
  noteCount: number;
  children: Notebook[];
  level: number;
  onEdit: (nb: Notebook) => void;
  onDelete: (id: string) => void;
  onPress: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={{ marginLeft: level * 16 }}>
      <Pressable
        style={({ pressed }) => [
          styles.notebookRow,
          pressed && styles.notebookRowPressed,
        ]}
        onPress={() => onPress(notebook.id)}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Alert.alert(notebook.name, "What would you like to do?", [
            { text: "Cancel", style: "cancel" },
            { text: "Edit", onPress: () => onEdit(notebook) },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => onDelete(notebook.id),
            },
          ]);
        }}
      >
        <View style={[styles.notebookColor, { backgroundColor: notebook.color }]} />
        <View style={styles.notebookInfo}>
          <Text style={styles.notebookName}>{notebook.name}</Text>
          <Text style={styles.notebookCount}>
            {noteCount} {noteCount === 1 ? "note" : "notes"}
          </Text>
        </View>
        {children.length > 0 ? (
          <Pressable
            onPress={() => setExpanded(!expanded)}
            hitSlop={12}
            style={styles.expandButton}
          >
            <Ionicons
              name={expanded ? "chevron-down" : "chevron-forward"}
              size={18}
              color={Colors.textTertiary}
            />
          </Pressable>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
      </Pressable>

      {expanded && children.length > 0
        ? children.map((child) => (
            <NotebookRow
              key={child.id}
              notebook={child}
              noteCount={0}
              children={[]}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onPress={onPress}
            />
          ))
        : null}
    </View>
  );
}

export default function ManageNotebooksScreen() {
  const insets = useSafeAreaInsets();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
  const [newName, setNewName] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [newColor, setNewColor] = useState(getRandomColor());

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const COLORS = [
    "#1B6B4A", "#3B82F6", "#8B5CF6", "#EC4899",
    "#F59E0B", "#EF4444", "#06B6D4", "#84CC16",
  ];

  const loadData = useCallback(async () => {
    try {
      const [allNotebooks, allNotes] = await Promise.all([
        getAllNotebooks(),
        getAllNotes(),
      ]);
      setNotebooks(allNotebooks);
      setNotes(allNotes);
    } catch {
      setNotebooks([]);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getNotesCount = (notebookId: string) => {
    return notes.filter((n) => n.notebookId === notebookId).length;
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      Alert.alert("Missing Name", "Please enter a name for the notebook.");
      return;
    }

    try {
      const nb = createNewNotebook(newName.trim(), selectedParentId);
      nb.color = newColor;
      await saveNotebook(nb);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCreateModal(false);
      setNewName("");
      setSelectedParentId(null);
      setNewColor(getRandomColor());
      loadData();
    } catch {
      Alert.alert("Error", "Failed to create notebook.");
    }
  };

  const handleEdit = (nb: Notebook) => {
    setEditingNotebook(nb);
    setNewName(nb.name);
    setNewColor(nb.color);
    setSelectedParentId(nb.parentId);
    setShowCreateModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingNotebook || !newName.trim()) return;

    try {
      const updated: Notebook = {
        ...editingNotebook,
        name: newName.trim(),
        color: newColor,
        parentId: selectedParentId,
        updatedAt: Date.now(),
      };
      await saveNotebook(updated);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCreateModal(false);
      setEditingNotebook(null);
      setNewName("");
      setNewColor(getRandomColor());
      setSelectedParentId(null);
      loadData();
    } catch {
      Alert.alert("Error", "Failed to update notebook.");
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Delete Notebook",
      "Notes in this notebook will be moved to 'No notebook'. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteNotebook(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadData();
          },
        },
      ]
    );
  };

  const handleNotebookPress = (notebookId: string) => {
    router.push({ pathname: "/notebooks/[id]", params: { id: notebookId } });
  };

  const { roots, children } = getNotebookTree(notebooks);

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
        <Text style={styles.headerTitle}>Notebooks</Text>
        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            pressed && styles.createButtonPressed,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setEditingNotebook(null);
            setNewName("");
            setNewColor(getRandomColor());
            setSelectedParentId(null);
            setShowCreateModal(true);
          }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {roots.length === 0 ? (
        <View style={styles.emptyState}>
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.emptyContent}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="folder-open-outline" size={48} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No notebooks yet</Text>
            <Text style={styles.emptyText}>
              Create notebooks to organize your notes into categories
            </Text>
          </Animated.View>
        </View>
      ) : (
        <FlatList
          data={roots}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotebookRow
              notebook={item}
              noteCount={getNotesCount(item.id)}
              children={children[item.id] || []}
              level={0}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPress={handleNotebookPress}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + webBottomInset + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + webBottomInset + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingNotebook ? "Edit Notebook" : "New Notebook"}
              </Text>
              <Pressable onPress={() => setShowCreateModal(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Notebook name"
              placeholderTextColor={Colors.textTertiary}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />

            <Text style={styles.modalLabel}>Color</Text>
            <View style={styles.colorRow}>
              {COLORS.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    newColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setNewColor(color)}
                />
              ))}
            </View>

            <Text style={styles.modalLabel}>Parent Stack (optional)</Text>
            <View style={styles.parentOptions}>
              <Pressable
                style={[
                  styles.parentOption,
                  !selectedParentId && styles.parentOptionSelected,
                ]}
                onPress={() => setSelectedParentId(null)}
              >
                <Text style={styles.parentOptionText}>None (top level)</Text>
              </Pressable>
              {notebooks
                .filter((nb) => nb.id !== editingNotebook?.id && !nb.parentId)
                .map((nb) => (
                  <Pressable
                    key={nb.id}
                    style={[
                      styles.parentOption,
                      selectedParentId === nb.id && styles.parentOptionSelected,
                    ]}
                    onPress={() => setSelectedParentId(nb.id)}
                  >
                    <View style={[styles.parentDot, { backgroundColor: nb.color }]} />
                    <Text style={styles.parentOptionText}>{nb.name}</Text>
                  </Pressable>
                ))}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.modalSaveButton,
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
              onPress={editingNotebook ? handleSaveEdit : handleCreate}
            >
              <Text style={styles.modalSaveText}>
                {editingNotebook ? "Update" : "Create"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 17,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
  },
  createButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonPressed: {
    backgroundColor: Colors.primaryDark,
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  notebookRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  notebookRowPressed: {
    backgroundColor: Colors.surfaceElevated,
  },
  notebookColor: {
    width: 12,
    height: 40,
    borderRadius: 6,
  },
  notebookInfo: {
    flex: 1,
  },
  notebookName: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
  },
  notebookCount: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  expandButton: {
    padding: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
    color: Colors.text,
  },
  modalInput: {
    fontSize: 16,
    fontFamily: "DMSans_400Regular",
    color: Colors.text,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: Colors.text,
  },
  parentOptions: {
    gap: 4,
    marginBottom: 20,
  },
  parentOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
  },
  parentOptionSelected: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  parentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  parentOptionText: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    color: Colors.text,
  },
  modalSaveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  modalSaveText: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: "#fff",
  },
});
