// Konten publik (tanpa login): slide, kategori, latihan, program, trofi.
const router = require('express').Router();
const db = require('../config/db');
const { fetchWorkouts } = require('../util');

router.get('/home/slides', async (req, res) => {
  const [rows] = await db.query('SELECT label, headline, image FROM hero_slides ORDER BY sort_order');
  res.json(rows);
});

router.get('/categories', async (req, res) => {
  const [rows] = await db.query('SELECT name, image, fallback_color AS fallbackColor FROM categories ORDER BY sort_order');
  res.json(rows);
});

// ?category=HIIT  ?q=yoga  ?hybrid=true
router.get('/workouts', async (req, res) => {
  const conds = [];
  const params = [];
  if (req.query.category) {
    conds.push('w.id IN (SELECT wc.workout_id FROM workout_categories wc JOIN categories c ON c.id = wc.category_id WHERE c.name = ?)');
    params.push(req.query.category);
  }
  if (req.query.q) {
    const like = `%${String(req.query.q).trim()}%`;
    conds.push(`(w.title LIKE ? OR w.focus LIKE ? OR w.id IN (
      SELECT wc.workout_id FROM workout_categories wc JOIN categories c ON c.id = wc.category_id WHERE c.name LIKE ?))`);
    params.push(like, like, like);
  }
  if (req.query.hybrid === 'true') conds.push('w.is_hybrid = 1');
  res.json(await fetchWorkouts(db, conds.length ? 'WHERE ' + conds.join(' AND ') : '', params));
});

router.get('/workouts/:id', async (req, res) => {
  const list = await fetchWorkouts(db, 'WHERE w.id = ?', [Number(req.params.id) || 0]);
  if (!list.length) return res.status(404).json({ message: 'Latihan tidak ditemukan.' });
  res.json(list[0]);
});

router.get('/programs', async (req, res) => {
  const [rows] = await db.query('SELECT title, description, meta, image FROM programs ORDER BY sort_order');
  res.json(rows);
});

router.get('/trophies', async (req, res) => {
  const [rows] = await db.query('SELECT name, icon, shape FROM trophies ORDER BY sort_order');
  res.json(rows);
});

module.exports = router;
