const router = require('express').Router();
const db = require('../config/db');
const { sign } = require('../middleware/auth');
const { userJson } = require('../util');

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const normEmail = (v) => String(v || '').trim().toLowerCase();

// Cek email: sudah terdaftar? (menentukan alur daftar atau masuk)
router.post('/check-email', async (req, res) => {
  const email = normEmail(req.body.email);
  if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Email tidak valid.' });
  const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  res.json({ exists: rows.length > 0 });
});

// Buat dan "kirim" kode verifikasi. Tanpa email sungguhan: kode dicetak di terminal
// dan (mode dev) dikembalikan di respons sebagai devCode.
router.post('/send-code', async (req, res) => {
  const email = normEmail(req.body.email);
  if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Email tidak valid.' });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await db.query(
    'INSERT INTO auth_codes (email, code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
    [email, code]
  );
  console.log(`[kode verifikasi] ${email} -> ${code}`);
  const body = { message: 'Kode dikirim.' };
  if (process.env.DEV_RETURN_CODE === 'true') body.devCode = code;
  res.json(body);
});

// Memakai kode (sekali pakai). Mengembalikan true jika valid.
async function consumeCode(email, code) {
  const [rows] = await db.query(
    'SELECT id FROM auth_codes WHERE email = ? AND code = ? AND used = 0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
    [email, String(code || '')]
  );
  if (!rows.length) return false;
  await db.query('UPDATE auth_codes SET used = 1 WHERE id = ?', [rows[0].id]);
  return true;
}

router.post('/register', async (req, res) => {
  const email = normEmail(req.body.email);
  const { code, firstName, lastName, birthDate, marketingOptIn } = req.body;
  if (!EMAIL_RE.test(email) || !firstName || !lastName) {
    return res.status(400).json({ message: 'Data pendaftaran belum lengkap.' });
  }
  const [exist] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (exist.length) return res.status(409).json({ message: 'Email sudah terdaftar.' });
  if (!(await consumeCode(email, code))) return res.status(400).json({ message: 'Kode salah atau kedaluwarsa.' });

  const [r] = await db.query(
    'INSERT INTO users (email, first_name, last_name, birth_date, marketing_opt_in) VALUES (?, ?, ?, ?, ?)',
    [email, String(firstName).trim(), String(lastName).trim(), birthDate || null, marketingOptIn ? 1 : 0]
  );
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [r.insertId]);
  res.status(201).json({ token: sign(rows[0]), user: userJson(rows[0]) });
});

router.post('/login', async (req, res) => {
  const email = normEmail(req.body.email);
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  if (!rows.length) return res.status(404).json({ message: 'Email belum terdaftar.' });
  if (!(await consumeCode(email, req.body.code))) return res.status(400).json({ message: 'Kode salah atau kedaluwarsa.' });
  res.json({ token: sign(rows[0]), user: userJson(rows[0]) });
});

module.exports = router;
