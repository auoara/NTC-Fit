require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (e) {
    res.status(500).json({ status: 'error', db: e.message });
  }
});

app.use('/auth', require('./routes/auth'));
app.use('/', require('./routes/content'));
app.use('/', require('./routes/me'));

app.use((req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan.' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Terjadi kesalahan server.' });
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => console.log(`NTC Fit API di http://localhost:${port}`));
