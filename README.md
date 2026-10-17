# NTC Fit (plesetan Nike Training Club)

## Anggota
| Nama | NIM |
|---|---|
| (isi) | (isi) |

Aplikasi asli: **Nike Training Club** -> plesetan: **NTC Fit**

## Struktur
- `app/`       : Flutter (salin folder proyek Flutter ke sini)
- `backend/`   : REST API (Node.js + Express + MySQL)
- `database/`  : `001_schema.sql` (tabel), `002_seed.sql` (data awal)
- `API.md`     : kontrak endpoint

## Menjalankan
1. Install Node.js LTS dan XAMPP, lalu Start **MySQL** di XAMPP.
2. Buka phpMyAdmin -> Import `database/001_schema.sql`, lalu `database/002_seed.sql`.
3. Backend:
   ```
   cd backend
   cp .env.example .env     # sesuaikan DB_PASSWORD bila perlu
   npm install
   npm run dev
   ```
   Cek `http://localhost:3000/health` -> `{"status":"ok","db":"connected"}`.
4. Flutter: `cd app && flutter pub get && flutter run`.
   Emulator Android memakai `http://10.0.2.2:3000`; HP asli memakai IP laptop (satu WiFi).

Kode verifikasi login/daftar tidak dikirim lewat email sungguhan: kode muncul di terminal backend
dan di respons `devCode` (mode dev).
