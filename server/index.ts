import express from 'express';
import path from 'path';
import fs from 'fs';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pkg from 'pg';
const { Pool } = pkg;
import { registerRoutes } from './routes.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

const PostgresStore = connectPgSimple(session);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(session({
  store: process.env.DATABASE_URL ? new PostgresStore({ pool, tableName: 'session', createTableIfMissing: true }) : undefined,
  secret: process.env.SESSION_SECRET || 'super_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 30 * 24 * 60 * 60 * 1000 }
}));

app.use(express.static(path.join(process.cwd(), 'static-build')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

registerRoutes(app);

app.get(/^(?!\/api).*/, (req, res) => {
  const landingPagePath = path.join(process.cwd(), 'server/templates/landing-page.html');
  if (fs.existsSync(landingPagePath)) {
    res.sendFile(landingPagePath);
  } else {
    res.status(200).send('Welcome to the Expo App Backend. Please use Expo Go to view the app.');
  }
});

app.listen(port, '0.0.0.0', () => console.log('Server running on port ' + port));