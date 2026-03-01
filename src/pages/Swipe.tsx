import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FlashcardSet, getSet, updateKnownCards } from "../lib/storage";

export default function SwipeScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (id) {
      const data = getSet(id);
      if (data) {
        setSet(data);
        setKnownIds(new Set(data.knownCardIds));
      } else {
        navigate("/");
      }
    }
  }, [id, navigate]);

  if (!set) return null;

  const currentCard = set.cards[currentIndex];
  const progress = ((currentIndex + (isFinished ? 1 : 0)) / set.cards.length) * 100;

  const handleNext = (known: boolean) => {
    if (!currentCard) return;

    const newKnownIds = new Set(knownIds);
    if (known) {
      newKnownIds.add(currentCard.id);
    } else {
      newKnownIds.delete(currentCard.id);
    }
    setKnownIds(newKnownIds);

    if (currentIndex < set.cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setIsFinished(true);
      updateKnownCards(set.id, Array.from(newKnownIds));
    }
  };

  const resetStudy = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
  };

  if (isFinished) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <button onClick={() => navigate("/")} style={styles.closeButton}>
            ✕ Close
          </button>
        </header>
        <div style={styles.finishedContainer}>
          <h2 style={styles.finishedTitle}>Great Job!</h2>
          <p style={styles.finishedText}>
            You knew {knownIds.size} out of {set.cards.length} cards.
          </p>
          <div style={styles.actionButtons}>
            <button onClick={resetStudy} style={styles.primaryBtn}>
              Study Again
            </button>
            <button onClick={() => navigate("/")} style={styles.secondaryBtn}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => navigate("/")} style={styles.closeButton}>
          ✕ Close
        </button>
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>
          <span style={styles.progressText}>
            {currentIndex + 1} / {set.cards.length}
          </span>
        </div>
        <div style={{ width: "60px" }} /> {/* Spacer */}
      </header>

      <div style={styles.cardContainer}>
        <div 
          style={{ ...styles.flashcard, ...(isFlipped ? styles.flashcardFlipped : {}) }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <h3 style={styles.cardText}>
            {isFlipped ? currentCard.back : currentCard.front}
          </h3>
          <p style={styles.flipHint}>
            Tap to see {isFlipped ? "term" : "definition"}
          </p>
        </div>
      </div>

      <div style={styles.footer}>
        <button 
          onClick={() => handleNext(false)} 
          style={{ ...styles.swipeBtn, ...styles.btnAgain }}
        >
          ✕ Again
        </button>
        <button 
          onClick={() => handleNext(true)} 
          style={{ ...styles.swipeBtn, ...styles.btnGotIt }}
        >
          ✓ Got It
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    height: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    backgroundColor: "#f8fafc",
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
  progressContainer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "4px",
    flex: 1,
  },
  progressBar: {
    width: "150px",
    height: "6px",
    backgroundColor: "#e2e8f0",
    borderRadius: "3px",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: "3px",
    transition: "width 0.3s ease",
  },
  progressText: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#64748b",
  },
  cardContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  flashcard: {
    width: "100%",
    maxWidth: "400px",
    minHeight: "300px",
    backgroundColor: "#fff",
    borderRadius: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    alignItems: "center",
    padding: "30px",
    cursor: "pointer",
    textAlign: "center" as const,
    border: "1px solid #e2e8f0",
  },
  flashcardFlipped: {
    backgroundColor: "#f0f9ff",
    borderColor: "#bfdbfe",
  },
  cardText: {
    fontSize: "24px",
    fontWeight: 500,
    color: "#0f172a",
    margin: "0 0 20px 0",
  },
  flipHint: {
    fontSize: "14px",
    color: "#94a3b8",
    margin: 0,
  },
  footer: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    padding: "20px",
    backgroundColor: "#fff",
    borderTop: "1px solid #e2e8f0",
  },
  swipeBtn: {
    padding: "16px 32px",
    borderRadius: "30px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
  },
  btnAgain: {
    backgroundColor: "#fee2e2",
    color: "#ef4444",
  },
  btnGotIt: {
    backgroundColor: "#dcfce7",
    color: "#22c55e",
  },
  finishedContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    textAlign: "center" as const,
  },
  finishedTitle: {
    fontSize: "32px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "10px",
  },
  finishedText: {
    fontSize: "18px",
    color: "#64748b",
    marginBottom: "30px",
  },
  actionButtons: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
    width: "100%",
    maxWidth: "200px",
  },
  primaryBtn: {
    padding: "14px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "14px",
    backgroundColor: "#f1f5f9",
    color: "#475569",
    border: "none",
    borderRadius: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },
};