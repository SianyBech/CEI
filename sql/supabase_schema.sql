-- Supabase / PostgreSQL schema for the Cerne Evidências app
-- Run this in the Supabase SQL Editor or psql to create the required table.
-- Notes:
--  - We use quoted column names to preserve camelCase keys used by the existing Node app
--  - Ensure the "pgcrypto" extension is available for gen_random_uuid(); Supabase provides it by default

-- Enable extension for UUID generation (Supabase usually has this enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create evidences table
CREATE TABLE IF NOT EXISTS public.evidences (
  id text PRIMARY KEY,
  "titulo" text,
  "nome" text NOT NULL,
  "tipo" text,
  "data" text,
  "evento" text,
  "categoria" text,
  "responsavel" text,
  "tags" jsonb DEFAULT '[]'::jsonb,
  "resumo" text,
  "textoExtraido" text,
  "caminhoArquivo" text,
  "criadoEm" timestamptz DEFAULT now()
);

-- Index to speed up JSONB tag queries
CREATE INDEX IF NOT EXISTS idx_evidences_tags ON public.evidences USING gin (("tags"));

-- Optional: example GRANTs for a dedicated DB role (adjust role name as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidences TO your_db_role;

-- Example insert (uncomment to test in SQL editor):
-- INSERT INTO public.evidences ("titulo","nome","tipo","data","evento","categoria","responsavel","tags","resumo","textoExtraido","caminhoArquivo")
-- VALUES ('Exemplo', 'arquivo.pdf', 'pdf', '2026-07-06', 'Evento X', 'Gestão', 'João', '[]', 'Resumo automático', 'Texto extraído aqui', '/storage/originals/arquivo.pdf');
