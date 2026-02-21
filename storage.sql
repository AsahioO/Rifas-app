-- 1. Crear el baúl de almacenamiento (Bucket) llamado "rifas-images"
INSERT INTO storage.buckets (id, name, public)
VALUES ('rifas-images', 'rifas-images', true) ON CONFLICT (id) DO NOTHING;
-- 2. Dar permisos para que cualquiera pueda VER las imágenes
CREATE POLICY "Imagenes Publicas" ON storage.objects FOR
SELECT USING (bucket_id = 'rifas-images');
-- 3. Dar permisos para que la app pueda SUBIR nuevas imágenes
CREATE POLICY "Permitir Subidas" ON storage.objects FOR
INSERT WITH CHECK (bucket_id = 'rifas-images');