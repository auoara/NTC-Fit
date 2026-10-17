// Pembentuk JSON yang cocok dengan model Dart (camelCase, id bertipe String).

function userJson(u) {
  return {
    id: String(u.id),
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    birthDate: u.birth_date,           // 'YYYY-MM-DD' atau null
    marketingOptIn: !!u.marketing_opt_in,
    gender: u.gender,                  // 'female' | 'male' | null
    weeklyFrequency: u.weekly_frequency, // 'low' | 'medium' | 'high' | null
    joinedAt: u.joined_at,
  };
}

// Ambil workout beserta gerakan dan kategori. Filter opsional lewat where/params.
async function fetchWorkouts(db, where = '', params = []) {
  const [ws] = await db.query(`SELECT * FROM workouts w ${where} ORDER BY w.id`, params);
  if (!ws.length) return [];
  const ids = ws.map((w) => w.id);
  const [exs] = await db.query(
    'SELECT workout_id, name, reps, seconds, cue FROM workout_exercises WHERE workout_id IN (?) ORDER BY workout_id, position',
    [ids]
  );
  const [cats] = await db.query(
    `SELECT wc.workout_id, c.name FROM workout_categories wc
     JOIN categories c ON c.id = wc.category_id WHERE wc.workout_id IN (?) ORDER BY c.sort_order`,
    [ids]
  );
  return ws.map((w) => ({
    id: String(w.id),
    title: w.title,
    level: w.level,
    equipment: w.equipment,
    focus: w.focus,
    minutes: w.minutes,
    image: w.image,
    isNew: !!w.is_new,
    description: w.description,
    categories: cats.filter((c) => c.workout_id === w.id).map((c) => c.name),
    exercises: exs
      .filter((e) => e.workout_id === w.id)
      .map((e) => ({ name: e.name, reps: e.reps, seconds: e.seconds, cue: e.cue })),
  }));
}

module.exports = { userJson, fetchWorkouts };
