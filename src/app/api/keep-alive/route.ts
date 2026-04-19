import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Esta ruta es llamada periódicamente por un cron job
// para evitar que Supabase pause el proyecto por inactividad.
// No requiere autenticación ya que solo hace un ping anónimo.

export async function GET(request: Request) {
    // Verificación opcional con un secret para que no cualquiera pueda llamarla
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Query mínimo: solo pide 1 fila de cualquier tabla pública.
        // Supabase considera esto actividad suficiente para no pausar el proyecto.
        const { error } = await supabase
            .from('rifas') // <-- Cambia 'rifas' por cualquier tabla que tengas
            .select('id')
            .limit(1);

        if (error) {
            // Incluso un error de Supabase cuenta como "actividad" para ellos,
            // pero lo registramos para debugging.
            console.error('[keep-alive] Supabase error:', error.message);
            return NextResponse.json(
                { success: false, error: error.message, timestamp: new Date().toISOString() },
                { status: 500 }
            );
        }

        console.log('[keep-alive] Ping exitoso a Supabase:', new Date().toISOString());
        return NextResponse.json({
            success: true,
            message: 'Supabase keep-alive ping successful',
            timestamp: new Date().toISOString(),
        });

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[keep-alive] Error inesperado:', message);
        return NextResponse.json(
            { success: false, error: message, timestamp: new Date().toISOString() },
            { status: 500 }
        );
    }
}
