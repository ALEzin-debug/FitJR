-- =============================================
-- Migration: Criar tabela set_logs
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- Tabela para registrar peso e reps de cada série
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

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_set_logs_log_id ON set_logs(log_id);
CREATE INDEX IF NOT EXISTS idx_set_logs_exercise_id ON set_logs(exercise_id);

-- RLS
ALTER TABLE set_logs ENABLE ROW LEVEL SECURITY;

-- Alunos podem inserir seus set_logs (via log deles)
CREATE POLICY "Students can insert their set_logs"
  ON set_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM logs
      WHERE logs.id = set_logs.log_id
      AND logs.student_id = auth.uid()
    )
  );

-- Alunos podem ver seus set_logs
CREATE POLICY "Students can view their set_logs"
  ON set_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM logs
      WHERE logs.id = set_logs.log_id
      AND logs.student_id = auth.uid()
    )
  );

-- Personals podem ver set_logs dos seus alunos
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
