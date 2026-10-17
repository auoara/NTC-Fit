# Kontrak API NTC Fit

Base URL: `http://10.0.2.2:3000` (emulator Android) atau `http://<IP-laptop>:3000` (HP asli).
Format: JSON, camelCase. `id` selalu **String**. Error: `{ "message": "..." }`.
Endpoint bertanda 🔒 butuh header `Authorization: Bearer <token>`.

## Auth (tanpa password: email + kode)
| Method | Path | Body | Respons |
|---|---|---|---|
| POST | /auth/check-email | `{email}` | `{exists: bool}` |
| POST | /auth/send-code | `{email}` | `{message, devCode?}` (devCode hanya jika DEV_RETURN_CODE=true) |
| POST | /auth/register | `{email, code, firstName, lastName, birthDate:"YYYY-MM-DD", marketingOptIn}` | `{token, user}` |
| POST | /auth/login | `{email, code}` | `{token, user}` |

Alur Flutter: EmailScreen -> `check-email` + `send-code` -> RegisterScreen (kode + data) -> `register`.
Email lama: `login` dengan kode, lalu lanjut ke SigninSuccess.

## Pengguna 🔒
| Method | Path | Keterangan |
|---|---|---|
| GET | /me | profil (dipakai splash untuk cek token, Profil, Pengaturan) |
| PUT | /me/onboarding | `{gender:"female"\|"male", weeklyFrequency:"low"\|"medium"\|"high"}` |
| DELETE | /me | hapus akun |
| GET | /saved | daftar workout yang disimpan (objek Workout lengkap) |
| GET | /saved/ids | `["1","4"]` untuk mengisi `session.savedIds` |
| POST / DELETE | /saved/:workoutId | simpan / batal simpan |
| GET | /history | riwayat, terbaru dulu |
| POST | /history | `{workoutId, seconds, completedAt?}` |
| GET | /inbox | pesan |
| PATCH | /inbox/:id/read | tandai dibaca |

## Konten (tanpa login)
| Method | Path | Respons |
|---|---|---|
| GET | /home/slides | `[{label, headline, image}]` |
| GET | /categories | `[{name, image, fallbackColor:"#RRGGBB"}]` |
| GET | /workouts?category=&q=&hybrid=true | `[Workout]` |
| GET | /workouts/:id | `Workout` |
| GET | /programs | `[{title, description, meta, image}]` |
| GET | /trophies | `[{name, icon, shape:"diamond"\|"circle"}]` (`icon` = nama `Icons.*`) |

`Workout`: `{id, title, level, equipment, focus, minutes, image, isNew, description, categories:[String], exercises:[{name, reps|null, seconds|null, cue}]}`

`image` adalah path asset lokal Flutter (mis. `assets/images/core_plank.jpg`), jadi `AppImage` tidak perlu diubah.
