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
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Crypto from "expo-crypto";
import Animated, { FadeInDown } from "react-native-reanimated";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import Colors from "@/constants/colors";
import {
  ContentBlock,
  NoteTask,
  Note,
  Notebook,
  createNewNote,
  saveNote,
  getAllNotebooks,
} from "@/lib/notes-storage";

type BlockType = ContentBlock["type"];

function BlockEditor({
  block,
  index,
  onUpdate,
  onDelete,
  onChangeType,
  canDelete,
}: {
  block: ContentBlock;
  index: number;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onChangeType: (id: string, type: BlockType) => void;
  canDelete: boolean;
}) {
  const getPrefix = () => {
    switch (block.type) {
      case "bullet":
        return "•  ";
      case "numbered":
        return `${index + 1}.  `;
      case "heading":
        return "";
      case "checkbox":
        return "";
      default:
        return "";
    }
  };

  return (
    <View style={styles.blockRow}>
      {block.type === "checkbox" ? (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChangeType(block.id, "checkbox");
          }}
          style={styles.checkboxButton}
        >
          <Ionicons
            name={block.checked ? "checkbox" : "square-outline"}
            size={20}
            color={block.checked ? Colors.primary : Colors.textTertiary}
          />
        </Pressable>
      ) : block.type === "bullet" || block.type === "numbered" ? (
        <Text style={styles.blockPrefix}>{getPrefix()}</Text>
      ) : null}
      <TextInput
        style={[
          styles.blockInput,
          block.type === "heading" && styles.headingInput,
          block.type === "checkbox" && block.checked && styles.checkedText,
        ]}
        placeholder={
          block.type === "heading"
            ? "Heading"
            : block.type === "checkbox"
            ? "Task..."
            : "Type something..."
        }
        placeholderTextColor={Colors.textTertiary}
        value={block.content}
        onChangeText={(v) => onUpdate(block.id, v)}
        multiline
      />
      {canDelete ? (
        <Pressable
          onPress={() => onDelete(block.id)}
          hitSlop={8}
          style={styles.blockDeleteBtn}
        >
          <Feather name="x" size={14} color={Colors.textTertiary} />
        </Pressable>
      ) : null}
    </View>
  );
}

function TaskEditor({
  task,
  onUpdate,
  onToggle,
  onDelete,
}: {
  task: NoteTask;
  onUpdate: (id: string, title: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={styles.taskRow}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle(task.id);
        }}
        style={styles.taskCheckbox}
      >
        <Ionicons
          name={task.completed ? "checkmark-circle" : "ellipse-outline"}
          size={22}
          color={task.completed ? Colors.success : Colors.textTertiary}
        />
      </Pressable>
      <TextInput
        style={[styles.taskInput, task.completed && styles.taskCompleted]}
        placeholder="Task description..."
        placeholderTextColor={Colors.textTertiary}
        value={task.title}
        onChangeText={(v) => onUpdate(task.id, v)}
      />
      <Pressable onPress={() => onDelete(task.id)} hitSlop={8}>
        <Feather name="x" size={14} color={Colors.textTertiary} />
      </Pressable>
    </View>
  );
}

export default function CreateNoteScreen() {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<ContentBlock[]>([
    { id: Crypto.randomUUID(), type: "text", content: "" },
  ]);
  const [tasks, setTasks] = useState<NoteTask[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showNotebookPicker, setShowNotebookPicker] = useState(false);

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  useEffect(() => {
    getAllNotebooks().then(setNotebooks);
  }, []);

  const addBlock = (type: BlockType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBlocks((prev) => [
      ...prev,
      { id: Crypto.randomUUID(), type, content: "", checked: type === "checkbox" ? false : undefined },
    ]);
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content } : b))
    );
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const toggleCheckbox = (id: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, checked: !b.checked } : b
      )
    );
  };

  const addTask = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTasks((prev) => [
      ...prev,
      { id: Crypto.randomUUID(), title: "", completed: false },
    ]);
  };

  const updateTask = (id: string, title: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title } : t))
    );
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, "");
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    Keyboard.dismiss();

    if (!title.trim() && blocks.every((b) => !b.content.trim())) {
      Alert.alert("Empty Note", "Please add a title or some content.");
      return;
    }

    try {
      const note = createNewNote(title.trim(), selectedNotebookId);
      note.content = blocks.filter((b) => b.content.trim() || b.type === "checkbox");
      note.tasks = tasks.filter((t) => t.title.trim());
      note.tags = tags;
      await saveNote(note);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save note.");
    }
  };

  const selectedNotebook = notebooks.find((nb) => nb.id === selectedNotebookId);

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
        <Text style={styles.headerTitle}>New Note</Text>
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.saveButtonPressed,
          ]}
          onPress={handleSave}
          testID="save-note-button"
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + webBottomInset + 120 },
        ]}
        bottomOffset={60}
      >
        <View style={styles.metaSection}>
          <TextInput
            style={styles.titleInput}
            placeholder="Note Title"
            placeholderTextColor={Colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          <Pressable
            style={styles.notebookSelector}
            onPress={() => setShowNotebookPicker(!showNotebookPicker)}
          >
            <Ionicons name="folder-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.notebookSelectorText}>
              {selectedNotebook ? selectedNotebook.name : "No notebook"}
            </Text>
            <Ionicons name="chevron-down" size={14} color={Colors.textTertiary} />
          </Pressable>

          {showNotebookPicker ? (
            <Animated.View entering={FadeInDown.duration(200)} style={styles.notebookList}>
              <Pressable
                style={[
                  styles.notebookOption,
                  !selectedNotebookId && styles.notebookOptionSelected,
                ]}
                onPress={() => {
                  setSelectedNotebookId(null);
                  setShowNotebookPicker(false);
                }}
              >
                <Text style={styles.notebookOptionText}>No notebook</Text>
              </Pressable>
              {notebooks.map((nb) => (
                <Pressable
                  key={nb.id}
                  style={[
                    styles.notebookOption,
                    selectedNotebookId === nb.id && styles.notebookOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedNotebookId(nb.id);
                    setShowNotebookPicker(false);
                  }}
                >
                  <View style={[styles.notebookColorDot, { backgroundColor: nb.color }]} />
                  <Text style={styles.notebookOptionText}>{nb.name}</Text>
                </Pressable>
              ))}
            </Animated.View>
          ) : null}
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionLabel}>Content</Text>
          {blocks.map((block, index) => (
            <BlockEditor
              key={block.id}
              block={block}
              index={index}
              onUpdate={updateBlock}
              onDelete={deleteBlock}
              onChangeType={(id) => toggleCheckbox(id)}
              canDelete={blocks.length > 1}
            />
          ))}
        </View>

        <View style={styles.toolbar}>
          <Pressable style={styles.toolButton} onPress={() => addBlock("text")}>
            <Feather name="type" size={16} color={Colors.textSecondary} />
            <Text style={styles.toolLabel}>Text</Text>
          </Pressable>
          <Pressable style={styles.toolButton} onPress={() => addBlock("heading")}>
            <Feather name="bold" size={16} color={Colors.textSecondary} />
            <Text style={styles.toolLabel}>Heading</Text>
          </Pressable>
          <Pressable style={styles.toolButton} onPress={() => addBlock("bullet")}>
            <Feather name="list" size={16} color={Colors.textSecondary} />
            <Text style={styles.toolLabel}>Bullet</Text>
          </Pressable>
          <Pressable style={styles.toolButton} onPress={() => addBlock("numbered")}>
            <Feather name="hash" size={16} color={Colors.textSecondary} />
            <Text style={styles.toolLabel}>Number</Text>
          </Pressable>
          <Pressable style={styles.toolButton} onPress={() => addBlock("checkbox")}>
            <Feather name="check-square" size={16} color={Colors.textSecondary} />
            <Text style={styles.toolLabel}>Check</Text>
          </Pressable>
        </View>

        {tasks.length > 0 ? (
          <View style={styles.tasksSection}>
            <Text style={styles.sectionLabel}>Tasks</Text>
            {tasks.map((task) => (
              <TaskEditor
                key={task.id}
                task={task}
                onUpdate={updateTask}
                onToggle={toggleTask}
                onDelete={deleteTask}
              />
            ))}
          </View>
        ) : null}

        <Pressable style={styles.addTaskButton} onPress={addTask}>
          <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.addTaskText}>Add Task</Text>
        </Pressable>

        <View style={styles.tagsSection}>
          <Text style={styles.sectionLabel}>Tags</Text>
          <View style={styles.tagsRow}>
            {tags.map((tag) => (
              <Pressable
                key={tag}
                style={styles.tagChip}
                onPress={() => removeTag(tag)}
              >
                <Text style={styles.tagChipText}>#{tag}</Text>
                <Feather name="x" size={12} color={Colors.primary} />
              </Pressable>
            ))}
          </View>
          <View style={styles.tagInputRow}>
            <TextInput
              style={styles.tagInputField}
              placeholder="Add a tag..."
              placeholderTextColor={Colors.textTertiary}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addTag}
              returnKeyType="done"
            />
            {tagInput.trim() ? (
              <Pressable onPress={addTag} style={styles.addTagBtn}>
                <Ionicons name="add" size={18} color={Colors.primary} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>
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
    marginBottom: 16,
  },
  titleInput: {
    fontSize: 20,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.text,
    paddingVertical: 8,
  },
  notebookSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: 4,
  },
  notebookSelectorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.textSecondary,
  },
  notebookList: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 8,
    gap: 2,
  },
  notebookOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  notebookOptionSelected: {
    backgroundColor: Colors.primaryLight,
  },
  notebookColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notebookOptionText: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    color: Colors.text,
  },
  contentSection: {
    gap: 6,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  blockRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  blockPrefix: {
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
    color: Colors.textSecondary,
    marginTop: 6,
    width: 24,
  },
  checkboxButton: {
    marginTop: 4,
    marginRight: 8,
  },
  blockInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.text,
    minHeight: 36,
    paddingVertical: 4,
  },
  headingInput: {
    fontSize: 18,
    fontFamily: "DMSans_700Bold",
  },
  checkedText: {
    textDecorationLine: "line-through",
    color: Colors.textTertiary,
  },
  blockDeleteBtn: {
    paddingTop: 6,
    paddingLeft: 8,
  },
  toolbar: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
    marginBottom: 16,
  },
  toolButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toolLabel: {
    fontSize: 10,
    fontFamily: "DMSans_500Medium",
    color: Colors.textTertiary,
  },
  tasksSection: {
    gap: 6,
    marginBottom: 12,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  taskCheckbox: {
    marginRight: 0,
  },
  taskInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.text,
    height: 36,
  },
  taskCompleted: {
    textDecorationLine: "line-through",
    color: Colors.textTertiary,
  },
  addTaskButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    marginBottom: 16,
  },
  addTaskText: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.primary,
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagChipText: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.primary,
  },
  tagInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  tagInputField: {
    flex: 1,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.text,
    height: 40,
  },
  addTagBtn: {
    padding: 4,
  },
});
