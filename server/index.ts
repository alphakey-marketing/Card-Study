import express from 'express';
import path from 'path';
import fs from 'fs';
const app = express();
const port = process.env.PORT || 5000;

// Serve static files from the 'static-build' directory
app.use(express.static(path.join(process.cwd(), 'static-build')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// For any other request, serve the landing page if it exists, or a simple message
// Using a regex for Express 5 catch-all compatibility
app.get(/^(?!\/api).*/, (req, res) => {
  const landingPagePath = path.join(process.cwd(), 'server/templates/landing-page.html');
  if (fs.existsSync(landingPagePath)) {
    res.sendFile(landingPagePath);
  } else {
    res.status(200).send('Welcome to the Expo App Backend. Please use Expo Go to view the app.');
  }
});

app.listen(port, '0.0.0.0', () => console.log('Server running on port ' + port));
