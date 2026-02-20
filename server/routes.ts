import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { OAuth2Client } from "google-auth-library";
import { pool } from "./db";
import {
  upsertUser,
  getUserSets,
  getSetById,
  createSet,
  updateSet,
  deleteSetById,
  getUser,
} from "./storage";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

function requireAuth(req: Request, res: Response, next: () => void) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const PgStore = pgSession(session);

  app.use(
    session({
      store: new PgStore({
        pool: pool as any,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "flashmind-dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      },
    })
  );

  app.post("/api/auth/google", async (req: Request, res: Response) => {
    try {
      const { idToken, accessToken } = req.body;

      let googleId: string;
      let email: string;
      let name: string;
      let avatarUrl: string | undefined;

      if (idToken) {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
          return res.status(500).json({ message: "Google Client ID not configured" });
        }
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({
          idToken,
          audience: clientId,
        });
        const payload = ticket.getPayload();
        if (!payload) {
          return res.status(401).json({ message: "Invalid token" });
        }
        googleId = payload.sub;
        email = payload.email || "";
        name = payload.name || "";
        avatarUrl = payload.picture;
      } else if (accessToken) {
        const response = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!response.ok) {
          return res.status(401).json({ message: "Invalid access token" });
        }
        const userInfo = await response.json();
        googleId = userInfo.sub;
        email = userInfo.email || "";
        name = userInfo.name || "";
        avatarUrl = userInfo.picture;
      } else {
        return res.status(400).json({ message: "No token provided" });
      }

      const user = await upsertUser({ googleId, email, name, avatarUrl });
      req.session.userId = user.id;

      res.json({ user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl } });
    } catch (err) {
      console.error("Google auth error:", err);
      res.status(401).json({ message: "Authentication failed" });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    res.json({ user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl } });
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/sets", requireAuth, async (req: Request, res: Response) => {
    const sets = await getUserSets(req.session.userId!);
    res.json(sets);
  });

  app.get("/api/sets/:id", requireAuth, async (req: Request, res: Response) => {
    const set = await getSetById(req.params.id, req.session.userId!);
    if (!set) {
      return res.status(404).json({ message: "Set not found" });
    }
    res.json(set);
  });

  app.post("/api/sets", requireAuth, async (req: Request, res: Response) => {
    const { title, description, cards } = req.body;
    const set = await createSet(req.session.userId!, { title, description: description || "", cards: cards || [] });
    res.status(201).json(set);
  });

  app.put("/api/sets/:id", requireAuth, async (req: Request, res: Response) => {
    const updated = await updateSet(req.params.id, req.session.userId!, req.body);
    if (!updated) {
      return res.status(404).json({ message: "Set not found" });
    }
    res.json(updated);
  });

  app.delete("/api/sets/:id", requireAuth, async (req: Request, res: Response) => {
    const deleted = await deleteSetById(req.params.id, req.session.userId!);
    if (!deleted) {
      return res.status(404).json({ message: "Set not found" });
    }
    res.json({ ok: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}
