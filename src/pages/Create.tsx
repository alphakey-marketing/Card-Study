import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createNewSet, saveSet } from "../lib/storage";

interface CardDraft {
  id: string;
  front: string;
  back: string;
}

export default function CreateScreen() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState<CardDraft[]>([
    { id: crypto.randomUUID(), front: "", back: "" },
    { id: crypto.randomUUID(), front: "", back: "" },
  ]);

  const handleAddCard = () => {
    setCards((prev) => [
      ...prev,
      { id: crypto.randomUUID(), front: "", back: "" },
    ]);
  };

  const handleUpdateCard = (id: string, field: "front" | "back", value: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleDeleteCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert("Please enter a title for your set.");
      return;
    }

    const validCards = cards.filter((c) => c.front.trim() && c.back.trim());

    if (validCards.length === 0) {
      alert("Please add at least one card with both a term and definition.");
      return;
    }

    const newSet = createNewSet(title.trim(), description.trim(), validCards);
    saveSet(newSet);
    navigate("/");
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => navigate("/")} style={styles.closeButton}>
          ✕ Close
        </button>
        <h2 style={styles.headerTitle}>New Set</h2>
        <button onClick={handleSave} style={styles.saveButton}>
          Save
        </button>
      </header>

      <div style={styles.content}>
        <div style={styles.metaSection}>
          <input
            style={styles.titleInput}
            placeholder="Set Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <input
            style={styles.descInput}
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div style={styles.cardsSection}>
          <h3 style={styles.sectionLabel}>Cards ({cards.length})</h3>
          {cards.map((card, index) => (
            <div key={card.id} style={styles.cardEditor}>
              <div style={styles.cardEditorHeader}>
                <span style={styles.cardNumber}>Card {index + 1}</span>
                {cards.length > 1 && (
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    style={styles.deleteButton}
                  >
                    Delete
                  </button>
                )}
              </div>
              <textarea
                style={styles.cardInput}
                placeholder="Term / Question"
                value={card.front}
                onChange={(e) => handleUpdateCard(card.id, "front", e.target.value)}
              />
              <div style={styles.cardDivider} />
              <textarea
                style={styles.cardInput}
                placeholder="Definition / Answer"
                value={card.back}
                onChange={(e) => handleUpdateCard(card.id, "back", e.target.value)}
              />
            </div>
          ))}
        </div>

        <button onClick={handleAddCard} style={styles.addCardButton}>
          + Add Card
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    paddingBottom: "100px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    backgroundColor: "#fff",
    borderBottom: "1px solid #e2e8f0",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    color: "#64748b",
  },
  headerTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 600,
  },
  saveButton: {
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "20px",
    cursor: "pointer",
    fontWeight: 600,
  },
  content: {
    padding: "16px",
  },
  metaSection: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "16px",
    border: "1px solid #e2e8f0",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
  },
  titleInput: {
    fontSize: "20px",
    fontWeight: 600,
    border: "none",
    outline: "none",
    padding: "8px 0",
  },
  descInput: {
    fontSize: "15px",
    border: "none",
    borderTop: "1px solid #e2e8f0",
    outline: "none",
    padding: "8px 0",
    marginTop: "4px",
  },
  cardsSection: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  sectionLabel: {
    fontSize: "14px",
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    marginBottom: "8px",
  },
  cardEditor: {
    backgroundColor: "#fff",
    borderRadius: "14px",
    padding: "14px",
    border: "1px solid #e2e8f0",
  },
  cardEditorHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  cardNumber: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase" as const,
  },
  deleteButton: {
    background: "none",
    border: "none",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: "14px",
  },
  cardInput: {
    width: "100%",
    fontSize: "15px",
    border: "none",
    outline: "none",
    minHeight: "40px",
    resize: "vertical" as const,
    fontFamily: "inherit",
  },
  cardDivider: {
    height: "1px",
    backgroundColor: "#e2e8f0",
    margin: "8px 0",
  },
  addCardButton: {
    width: "100%",
    padding: "14px",
    marginTop: "16px",
    backgroundColor: "#eff6ff",
    color: "#3b82f6",
    border: "1px dashed #3b82f6",
    borderRadius: "14px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 600,
  },
};