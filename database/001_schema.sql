-- NTC Fit - skema database (MySQL / MariaDB)
CREATE DATABASE IF NOT EXISTS ntcfit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ntcfit;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS inbox_messages, workout_history, saved_workouts, workout_exercises,
  workout_categories, workouts, categories, programs, hero_slides, trophies, auth_codes, users;
SET FOREIGN_KEY_CHECKS = 1;

-- Pengguna (login tanpa password: email + kode verifikasi)
CREATE TABLE users (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  email            VARCHAR(150) NOT NULL UNIQUE,
  first_name       VARCHAR(80)  NOT NULL,
  last_name        VARCHAR(80)  NOT NULL,
  birth_date       DATE NULL,
  marketing_opt_in TINYINT(1) NOT NULL DEFAULT 0,
  gender           ENUM('female','male') NULL,
  weekly_frequency ENUM('low','medium','high') NULL,
  joined_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Kode verifikasi email (berlaku singkat)
CREATE TABLE auth_codes (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(150) NOT NULL,
  code       VARCHAR(8)   NOT NULL,
  expires_at DATETIME     NOT NULL,
  used       TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

CREATE TABLE hero_slides (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  label      VARCHAR(80)  NOT NULL,
  headline   VARCHAR(150) NOT NULL,
  image      VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE categories (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(60)  NOT NULL UNIQUE,
  image          VARCHAR(255) NOT NULL,
  fallback_color VARCHAR(9)   NOT NULL,   -- mis. #5E5B58
  sort_order     INT NOT NULL DEFAULT 0
);

CREATE TABLE workouts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  level       VARCHAR(30)  NOT NULL,
  equipment   VARCHAR(60)  NOT NULL,
  focus       VARCHAR(40)  NOT NULL,
  minutes     INT NOT NULL,
  image       VARCHAR(255) NOT NULL,
  is_new      TINYINT(1) NOT NULL DEFAULT 0,
  is_hybrid   TINYINT(1) NOT NULL DEFAULT 0,   -- tampil di "Mode Hibrid"
  description TEXT NOT NULL
);

CREATE TABLE workout_categories (
  workout_id  INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (workout_id, category_id),
  FOREIGN KEY (workout_id)  REFERENCES workouts(id)   ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Gerakan milik satu latihan. Isi reps ATAU seconds.
CREATE TABLE workout_exercises (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  workout_id INT NOT NULL,
  position   INT NOT NULL,
  name       VARCHAR(120) NOT NULL,
  reps       INT NULL,
  seconds    INT NULL,
  cue        TEXT NOT NULL,
  UNIQUE KEY uq_workout_pos (workout_id, position),
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
  CHECK (reps IS NOT NULL OR seconds IS NOT NULL)
);

CREATE TABLE saved_workouts (
  user_id    INT NOT NULL,
  workout_id INT NOT NULL,
  saved_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, workout_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
);

CREATE TABLE workout_history (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  workout_id     INT NOT NULL,
  title          VARCHAR(200) NOT NULL,
  completed_at   DATETIME NOT NULL,
  seconds        INT NOT NULL,
  exercise_count INT NOT NULL,
  INDEX idx_user_done (user_id, completed_at),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
);

CREATE TABLE programs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  meta        VARCHAR(120) NOT NULL,
  image       VARCHAR(255) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE trophies (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  icon       VARCHAR(60)  NOT NULL,                 -- nama Icons.* di Flutter
  shape      ENUM('diamond','circle') NOT NULL DEFAULT 'circle',
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE inbox_messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  title      VARCHAR(150) NOT NULL,
  body       TEXT NOT NULL,
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
