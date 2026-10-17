// Data milik pengguna yang login (semua butuh token).
const router = require('express').Router();
const db = require('../config/db');
const { auth } = require('../middleware/auth');
const { userJson, fetchWorkouts } = require('../util');

router.use(auth);

router.get('/me', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.userId]);
  if (!rows.length) return res.status(401).json({ message: 'Pengguna tidak ditemukan.' });
  res.json(userJson(rows[0]));
});

// Onboarding: gender dan frekuensi latihan (boleh salah satu)
router.put('/me/onboarding', async (req, res) => {
  const { gender, weeklyFrequency } = req.body;
  if (gender !== undefined && !['female', 'male'].includes(gender))
    return res.status(400).json({ message: 'gender tidak valid.' });
  if (weeklyFrequency !== undefined && !['low', 'medium', 'high'].includes(weeklyFrequency))
    return res.status(400).json({ message: 'weeklyFrequency tidak valid.' });
  if (gender !== undefined) await db.query('UPDATE users SET gender = ? WHERE id = ?', [gender, req.userId]);
  if (weeklyFrequency !== undefined)
    await db.query('UPDATE users SET weekly_frequency = ? WHERE id = ?', [weeklyFrequency, req.userId]);
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.userId]);
  res.json(userJson(rows[0]));
});

// Hapus akun (data terkait ikut terhapus lewat ON DELETE CASCADE)
router.delete('/me', async (req, res) => {
  await db.query('DELETE FROM users WHERE id = ?', [req.userId]);
  res.json({ message: 'Akun dihapus.' });
});

// ---- Disimpan ----
router.get('/saved', async (req, res) => {
  const where = 'WHERE w.id IN (SELECT workout_id FROM saved_workouts WHERE user_id = ?)';
  res.json(await fetchWorkouts(db, where, [req.userId]));
});

router.get('/saved/ids', async (req, res) => {
  const [rows] = await db.query('SELECT workout_id FROM saved_workouts WHERE user_id = ?', [req.userId]);
  res.json(rows.map((r) => String(r.workout_id)));
});

router.post('/saved/:workoutId', async (req, res) => {
  const [w] = await db.query('SELECT id FROM workouts WHERE id = ?', [Number(req.params.workoutId) || 0]);
  if (!w.length) return res.status(404).json({ message: 'Latihan tidak ditemukan.' });
  await db.query('INSERT IGNORE INTO saved_workouts (user_id, workout_id) VALUES (?, ?)', [req.userId, w[0].id]);
  res.status(201).json({ saved: true });
});

router.delete('/saved/:workoutId', async (req, res) => {
  await db.query('DELETE FROM saved_workouts WHERE user_id = ? AND workout_id = ?', [
    req.userId,
    Number(req.params.workoutId) || 0,
  ]);
  res.json({ saved: false });
});

// ---- Riwayat (Aktivitas > Riwayat, kartu "Selesai") ----
function historyJson(r) {
  return {
    workoutId: String(r.workout_id),
    title: r.title,
    completedAt: r.completed_at,
    seconds: r.seconds,
    exerciseCount: r.exercise_count,
  };
}

router.get('/history', async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM workout_history WHERE user_id = ? ORDER BY completed_at DESC, id DESC',
    [req.userId]
  );
  res.json(rows.map(historyJson));
});

// Body: { workoutId, seconds, completedAt? }  (title dan exerciseCount diambil dari DB)
router.post('/history', async (req, res) => {
  const seconds = Number(req.body.seconds);
  if (!Number.isFinite(seconds) || seconds < 0) return res.status(400).json({ message: 'seconds tidak valid.' });
  const [w] = await db.query(
    'SELECT w.id, w.title, (SELECT COUNT(*) FROM workout_exercises e WHERE e.workout_id = w.id) AS n FROM workouts w WHERE w.id = ?',
    [Number(req.body.workoutId) || 0]
  );
  if (!w.length) return res.status(404).json({ message: 'Latihan tidak ditemukan.' });
  const when = req.body.completedAt ? new Date(req.body.completedAt) : new Date();
  const [r] = await db.query(
    'INSERT INTO workout_history (user_id, workout_id, title, completed_at, seconds, exercise_count) VALUES (?, ?, ?, ?, ?, ?)',
    [req.userId, w[0].id, w[0].title, when, Math.round(seconds), w[0].n]
  );
  const [rows] = await db.query('SELECT * FROM workout_history WHERE id = ?', [r.insertId]);
  res.status(201).json(historyJson(rows[0]));
});

// ---- Kotak Masuk ----
router.get('/inbox', async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, title, body, is_read AS isRead, created_at AS createdAt FROM inbox_messages WHERE user_id = ? ORDER BY created_at DESC',
    [req.userId]
  );
  res.json(rows.map((m) => ({ ...m, id: String(m.id), isRead: !!m.isRead })));
});

router.patch('/inbox/:id/read', async (req, res) => {
  await db.query('UPDATE inbox_messages SET is_read = 1 WHERE id = ? AND user_id = ?', [
    Number(req.params.id) || 0,
    req.userId,
  ]);
  res.json({ isRead: true });
});

module.exports = router;
