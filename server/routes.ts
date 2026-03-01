import type { Express } from "express";
import { db } from "./db.js";
import { users, flashcardSets } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { OAuth2Client } from "google-auth-library";

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
const client = new OAuth2Client(CLIENT_ID);

export function registerRoutes(app: Express) {
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { token } = req.body;
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,
      });
      const payload = ticket.getPayload();
      
      if (!payload || !payload.email) {
        return res.status(401).json({ message: "Invalid token" });
      }

      let [user] = await db.select().from(users).where(eq(users.googleId, payload.sub));
      
      if (!user) {
        [user] = await db.insert(users).values({
          googleId: payload.sub,
          email: payload.email,
          name: payload.name || "User",
          avatarUrl: payload.picture,
        }).returning();
      }

      req.session.userId = user.id;
      res.json({ user });
    } catch (error) {
      console.error("Auth error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not logged in" });
    const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  });

  app.get("/api/flashcards", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const sets = await db.select().from(flashcardSets).where(eq(flashcardSets.userId, req.session.userId));
    res.json(sets);
  });

  app.post("/api/flashcards", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const { title, description, cards } = req.body;
    const [newSet] = await db.insert(flashcardSets).values({
      userId: req.session.userId,
      title,
      description,
      cards,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }).returning();
    res.json(newSet);
  });
}