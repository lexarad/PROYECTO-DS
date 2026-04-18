-- Script SQL para configurar Supabase Storage
-- Ejecutar en: https://supabase.com/dashboard/project/_/sql/new

-- 1. Crear bucket público para certificados
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificados', 'certificados', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Política de acceso público para PDFs
CREATE POLICY "Public Access to PDFs" ON storage.objects
FOR SELECT USING (bucket_id = 'certificados');

-- 3. Política para que el worker pueda subir archivos
CREATE POLICY "Worker Upload Access" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'certificados');

-- Verificar configuración
SELECT id, name, public FROM storage.buckets WHERE id = 'certificados';