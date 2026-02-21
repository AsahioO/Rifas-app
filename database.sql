-- Copia y pega todo esto en el SQL Editor de tu Supabase y dale a "Run"
-- 1. Tabla de Rifas
CREATE TABLE IF NOT EXISTS rifas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    total_boletos INTEGER NOT NULL,
    precio_boleto NUMERIC NOT NULL,
    giro_ganador INTEGER NOT NULL,
    fotos TEXT [] DEFAULT '{}',
    estado TEXT DEFAULT 'activa',
    ganador_boleto INTEGER,
    ganador_nombre TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 2. Tabla de Participantes
CREATE TABLE IF NOT EXISTS participantes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rifa_id UUID REFERENCES rifas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL,
    boletos INTEGER [] NOT NULL,
    estado TEXT DEFAULT 'apartado',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 3. Políticas de Seguridad (RLS) para permitir lectura/escritura pública temporalmente (Fase Portafolio/Pruebas)
ALTER TABLE rifas ENABLE ROW LEVEL SECURITY;
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Rifas" ON rifas FOR ALL USING (true);
CREATE POLICY "Public Access Participantes" ON participantes FOR ALL USING (true);