import express from 'express';
const app = express();
const port = process.env.PORT || 5000;
app.use(express.static('dist'));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.listen(port, '0.0.0.0', () => console.log('Server running on port ' + port));
