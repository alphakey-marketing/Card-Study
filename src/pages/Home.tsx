import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlashcardSet, getAllSets, deleteSet } from "../lib/storage";

export default function Home() {
  const navigate = useNavigate();
  const [sets, setSets] = useState<FlashcardSet[]>([]);

  useEffect(() => {
    setSets(getAllSets());
  }, []);

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteSet(id);
      setSets(getAllSets());
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>FlashMind</h1>
          <p style={styles.headerSubtitle}>
            {sets.length > 0
              ? `${sets.length} ${sets.length === 1 ? "set" : "sets"}`
              : "Create your first set"}
          </p>
        </div>
        <button
          style={styles.createButton}
          onClick={() => navigate("/create")}
        >
          + Add
        </button>
      </header>

      {sets.length === 0 ? (
        <div style={styles.emptyState}>
          <h2>No flashcard sets yet</h2>
          <p>Tap the + button to create your first set of flashcards.</p>
        </div>
      ) : (
        <div style={styles.listContent}>
          {sets.map((set) => {
            const knownCount = set.knownCardIds.length;
            const totalCount = set.cards.length;
            const progress = totalCount > 0 ? (knownCount / totalCount) * 100 : 0;

            return (
              <div key={set.id} style={styles.setCard}>
                <div style={styles.setCardHeader}>
                  <div style={styles.setCardTitleRow}>
                    <h3 style={styles.setCardTitle}>{set.title}</h3>
                    <button
                      onClick={() => handleDelete(set.id, set.title)}
                      style={styles.deleteBtn}
                    >
                      🗑
                    </button>
                  </div>
                  {set.description && (
                    <p style={styles.setCardDesc}>{set.description}</p>
                  )}
                </div>

                <div style={styles.setCardFooter}>
                  <div style={styles.cardCountBadge}>
                    <span>
                      {totalCount} {totalCount === 1 ? "card" : "cards"}
                    </span>
                  </div>

                  {totalCount > 0 && (
                    <div style={styles.progressContainer}>
                      <div style={styles.progressBar}>
                        <div
                          style={{
                            ...styles.progressFill,
                            width: `${progress}%`,
                          }}
                        />
                      </div>
                      <span style={styles.progressText}>
                        {knownCount}/{totalCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    padding: "20px",
    backgroundColor: "#fff",
    borderBottom: "1px solid #e2e8f0",
  },
  headerTitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: "-0.5px",
  },
  headerSubtitle: {
    margin: "4px 0 0 0",
    fontSize: "14px",
    color: "#64748b",
  },
  createButton: {
    width: "44px",
    height: "44px",
    borderRadius: "22px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: "16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  setCard: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "18px",
    border: "1px solid #e2e8f0",
  },
  setCardHeader: {
    marginBottom: "14px",
  },
  setCardTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  setCardTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 600,
    color: "#0f172a",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
  },
  setCardDesc: {
    margin: "4px 0 0 0",
    fontSize: "14px",
    color: "#64748b",
  },
  setCardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardCountBadge: {
    backgroundColor: "#eff6ff",
    color: "#3b82f6",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: 500,
  },
  progressContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  progressBar: {
    width: "60px",
    height: "4px",
    backgroundColor: "#e2e8f0",
    borderRadius: "2px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#22c55e",
    borderRadius: "2px",
  },
  progressText: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#94a3b8",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    textAlign: "center" as const,
    color: "#64748b",
  },
};