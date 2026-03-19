-- =============================================
-- MFit Personal - Schema SQL para Supabase
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- 1. Tabela de perfis
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('personal', 'student')),
  personal_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de treinos
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  personal_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de exercícios
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  reps TEXT NOT NULL DEFAULT '12',
  rest TEXT DEFAULT '60s',
  notes TEXT,
  video_url TEXT,
  order_index INTEGER DEFAULT 0
);

-- 4. Tabela de logs (check-ins)
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- 5. Tabela de registros por série (peso, reps, status)
CREATE TABLE IF NOT EXISTS set_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID NOT NULL REFERENCES logs(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight DECIMAL(6,2),
  reps INTEGER,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: usuários leem seu próprio perfil, personal lê perfis dos seus alunos
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Personals can view their students"
  ON profiles FOR SELECT
  USING (personal_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Workouts: personal vê treinos que criou, aluno vê seus treinos
CREATE POLICY "Personals can manage their workouts"
  ON workouts FOR ALL
  USING (personal_id = auth.uid());

CREATE POLICY "Students can view their workouts"
  ON workouts FOR SELECT
  USING (student_id = auth.uid());

-- Exercises: acesso via workout
CREATE POLICY "View exercises via workout (personal)"
  ON exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = exercises.workout_id
      AND workouts.personal_id = auth.uid()
    )
  );

CREATE POLICY "View exercises via workout (student)"
  ON exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = exercises.workout_id
      AND workouts.student_id = auth.uid()
    )
  );

-- Logs: aluno insere/vê seus logs, personal vê logs dos seus alunos
CREATE POLICY "Students can insert their logs"
  ON logs FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view their logs"
  ON logs FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Personals can view student logs"
  ON logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = logs.workout_id
      AND workouts.personal_id = auth.uid()
    )
  );
-- Set Logs: aluno insere/vê seus set_logs, personal vê dos seus alunos
CREATE POLICY "Students can insert their set_logs"
  ON set_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM logs
      WHERE logs.id = set_logs.log_id
      AND logs.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their set_logs"
  ON set_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM logs
      WHERE logs.id = set_logs.log_id
      AND logs.student_id = auth.uid()
    )
  );

CREATE POLICY "Personals can view student set_logs"
  ON set_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM logs
      JOIN workouts ON workouts.id = logs.workout_id
      WHERE logs.id = set_logs.log_id
      AND workouts.personal_id = auth.uid()
    )
  );

-- =============================================
-- Trigger: auto-create profile on sign up
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
