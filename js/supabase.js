// =============================================
// MFit Personal - Supabase Client & Helpers
// =============================================

const SUPABASE_URL = MFIT_CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = MFIT_CONFIG.SUPABASE_ANON_KEY;

// Initialize Supabase Client
// Using 'db' to avoid conflict with window.supabase (the SDK itself)
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Auth Helpers ---

async function signIn(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signUp(email, password, fullName, role) {
  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role
      }
    }
  });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await db.auth.signOut();
  if (error) throw error;
}

async function getUser() {
  const { data: { user } } = await db.auth.getUser();
  return user;
}

async function getSession() {
  const { data: { session } } = await db.auth.getSession();
  return session;
}

async function getProfile(userId) {
  const { data, error } = await db
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// --- Student Helpers ---

async function getStudents(personalId) {
  const { data, error } = await db
    .from('profiles')
    .select('*')
    .eq('personal_id', personalId)
    .eq('role', 'student')
    .order('full_name');
  if (error) throw error;
  return data || [];
}

async function linkStudentToPersonal(studentId, personalId) {
  const { error } = await db
    .from('profiles')
    .update({ personal_id: personalId })
    .eq('id', studentId);
  if (error) throw error;
}

// --- Workout Helpers ---

async function createWorkout(personalId, studentId, title, description) {
  const { data, error } = await db
    .from('workouts')
    .insert({ personal_id: personalId, student_id: studentId, title, description })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getWorkoutsByStudent(studentId) {
  const { data, error } = await db
    .from('workouts')
    .select('*, exercises(*)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function getWorkoutsByPersonal(personalId) {
  const { data, error } = await db
    .from('workouts')
    .select('*, exercises(*), profiles!workouts_student_id_fkey(full_name)')
    .eq('personal_id', personalId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function deleteWorkout(workoutId) {
  const { error } = await db
    .from('workouts')
    .delete()
    .eq('id', workoutId);
  if (error) throw error;
}

// --- Exercise Helpers ---

async function addExercises(workoutId, exercisesList) {
  const exercises = exercisesList.map((ex, index) => ({
    workout_id: workoutId,
    name: ex.name,
    sets: parseInt(ex.sets) || 3,
    reps: ex.reps || '12',
    rest: ex.rest || '60s',
    notes: ex.notes || '',
    video_url: ex.video_url || '',
    order_index: index
  }));

  const { data, error } = await db
    .from('exercises')
    .insert(exercises)
    .select();
  if (error) throw error;
  return data;
}

async function getExercises(workoutId) {
  const { data, error } = await db
    .from('exercises')
    .select('*')
    .eq('workout_id', workoutId)
    .order('order_index');
  if (error) throw error;
  return data || [];
}

// --- Log Helpers ---

async function logWorkout(studentId, workoutId, notes = '') {
  const { data, error } = await db
    .from('logs')
    .insert({ student_id: studentId, workout_id: workoutId, notes })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getStudentLogs(studentId) {
  const { data, error } = await db
    .from('logs')
    .select('*, workouts(title)')
    .eq('student_id', studentId)
    .order('completed_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

async function getStudentLogsByPersonal(personalId) {
  const { data, error } = await db
    .from('logs')
    .select('*, workouts!inner(title, personal_id), profiles!logs_student_id_fkey(full_name)')
    .eq('workouts.personal_id', personalId)
    .order('completed_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

// --- Set Logs Helpers ---

async function saveSetLogs(logId, exerciseId, sets) {
  const rows = sets.map(s => ({
    log_id: logId,
    exercise_id: exerciseId,
    set_number: s.set_number,
    weight: s.weight || null,
    reps: s.reps || null,
    completed: s.completed || false
  }));

  const { data, error } = await db
    .from('set_logs')
    .insert(rows)
    .select();
  if (error) throw error;
  return data;
}

async function getSetLogsByLog(logId) {
  const { data, error } = await db
    .from('set_logs')
    .select('*, exercises(name)')
    .eq('log_id', logId)
    .order('exercise_id')
    .order('set_number');
  if (error) throw error;
  return data || [];
}

async function getExerciseHistory(exerciseId, studentId) {
  const { data, error } = await db
    .from('set_logs')
    .select('*, logs!inner(student_id, completed_at)')
    .eq('exercise_id', exerciseId)
    .eq('logs.student_id', studentId)
    .order('logs.completed_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}
