import { supabase } from "./supabase";

export type Raffle = {
    id: string;
    nombre: string;
    descripcion: string;
    fotos: string[];
    precio_boleto: number;
    total_boletos: number;
    giro_ganador: number; // 3, 4 or 5
    estado: 'activa' | 'finalizada' | 'archivada';
    created_at: string;
    ganador_boleto?: number;
    ganador_nombre?: string;
};

export type Participant = {
    id: string;
    rifa_id: string;
    nombre: string;
    telefono: string;
    boletos: number[];
    estado: 'apartado' | 'pagado';
    created_at: string;
};

// Real database class
class Store {
    // --- API Methods ---

    async getActiveRaffle(): Promise<Raffle | null> {
        const { data, error } = await supabase
            .from('rifas')
            .select('*')
            .eq('estado', 'activa')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) return null;
        return data as Raffle;
    }

    async getLastFinishedRaffle(): Promise<Raffle | null> {
        const { data, error } = await supabase
            .from('rifas')
            .select('*')
            .eq('estado', 'finalizada')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) return null;
        return data as Raffle;
    }

    async getHistoricalRaffles(): Promise<Raffle[]> {
        const { data, error } = await supabase
            .from('rifas')
            .select('*')
            .in('estado', ['finalizada', 'archivada'])
            .order('created_at', { ascending: false });

        if (error || !data) return [];
        return data as Raffle[];
    }

    async getParticipants(): Promise<Participant[]> {
        const activeRaffle = await this.getActiveRaffle();
        if (!activeRaffle) return [];

        const { data, error } = await supabase
            .from('participantes')
            .select('*')
            .eq('rifa_id', activeRaffle.id)
            .order('created_at', { ascending: false });

        if (error || !data) return [];
        return data as Participant[];
    }

    async getTakenTickets(): Promise<number[]> {
        const participants = await this.getParticipants();
        return participants.flatMap(p => p.boletos);
    }

    async getFinancialStats(): Promise<{
        ingresosBrutos: number;
        ingresosProyectados: number;
        boletosVendidos: number;
        totalBoletos: number;
        precioBoleto: number;
    } | null> {
        const activeRaffle = await this.getActiveRaffle();
        if (!activeRaffle) return null;

        const participants = await this.getParticipants();

        let boletosVendidos = 0;

        participants.forEach(p => {
            boletosVendidos += p.boletos.length;
        });

        const precio = activeRaffle.precio_boleto;

        return {
            ingresosBrutos: boletosVendidos * precio,
            ingresosProyectados: activeRaffle.total_boletos * precio,
            boletosVendidos,
            totalBoletos: activeRaffle.total_boletos,
            precioBoleto: precio
        };
    }

    async getFinancialStatsForRaffle(raffleId: string, precioBoleto: number, totalBoletos: number): Promise<{
        ingresosBrutos: number;
        ingresosProyectados: number;
        boletosVendidos: number;
        totalBoletos: number;
        precioBoleto: number;
    }> {
        const { data, error } = await supabase
            .from('participantes')
            .select('*')
            .eq('rifa_id', raffleId);

        const participants: Participant[] = error || !data ? [] : data;

        let boletosVendidos = 0;

        participants.forEach(p => {
            boletosVendidos += p.boletos.length;
        });

        return {
            ingresosBrutos: boletosVendidos * precioBoleto,
            ingresosProyectados: totalBoletos * precioBoleto,
            boletosVendidos,
            totalBoletos,
            precioBoleto
        };
    }

    async createRaffle(data: Omit<Raffle, 'id' | 'estado' | 'created_at'>): Promise<{ data: Raffle | null, error: Error | null }> {
        const currentActive = await this.getActiveRaffle();
        if (currentActive && currentActive.estado === 'activa') {
            return { data: null, error: new Error("Ya existe una rifa activa. Termínala primero.") };
        }

        const { data: newRaffle, error } = await supabase
            .from('rifas')
            .insert([{ ...data, estado: 'activa' }])
            .select()
            .single();

        if (error) return { data: null, error: new Error(error.message) };
        return { data: newRaffle as Raffle, error: null };
    }

    async updateActiveRaffle(updates: Partial<Raffle>): Promise<{ data: Raffle | null, error: Error | null }> {
        const currentActive = await this.getActiveRaffle();
        if (!currentActive) {
            return { data: null, error: new Error("No hay rifa activa para actualizar.") };
        }

        const { data, error } = await supabase
            .from('rifas')
            .update(updates)
            .eq('id', currentActive.id)
            .select()
            .single();

        if (error) return { data: null, error: new Error(error.message) };
        return { data: data as Raffle, error: null };
    }

    async registerParticipant(nombre: string, telefono: string, boletos: number[]): Promise<{ data: Participant | null, error: Error | null }> {
        const activeRaffle = await this.getActiveRaffle();
        if (!activeRaffle) {
            return { data: null, error: new Error("No hay rifa activa para registrar participantes.") };
        }

        const taken = await this.getTakenTickets();
        const conflicts = boletos.filter(b => taken.includes(b));

        if (conflicts.length > 0) {
            return { data: null, error: new Error(`Los boletos ${conflicts.join(', ')} ya están ocupados.`) };
        }

        const { data: newParticipant, error } = await supabase
            .from('participantes')
            .insert([{
                rifa_id: activeRaffle.id,
                nombre,
                telefono,
                boletos,
                estado: 'pagado'
            }])
            .select()
            .single();

        if (error) return { data: null, error: new Error(error.message) };
        return { data: newParticipant as Participant, error: null };
    }

    async finalizeRaffle(ganador_boleto: number, ganador_nombre: string): Promise<{ data: Raffle | null, error: Error | null }> {
        const activeRaffle = await this.getActiveRaffle();
        if (!activeRaffle) return { data: null, error: new Error("No hay rifa activa.") };

        const { data, error } = await supabase
            .from('rifas')
            .update({
                estado: 'finalizada',
                ganador_boleto,
                ganador_nombre
            })
            .eq('id', activeRaffle.id)
            .select()
            .single();

        if (error) return { data: null, error: new Error(error.message) };
        return { data: data as Raffle, error: null };
    }

    async resetStore() {
        const activeRaffle = await this.getActiveRaffle();
        if (activeRaffle) {
            await supabase
                .from('rifas')
                .update({ estado: 'finalizada', ganador_nombre: 'Cancelada' })
                .eq('id', activeRaffle.id);
        }
    }

    async archiveWinner(): Promise<{ error: Error | null }> {
        const lastFinished = await this.getLastFinishedRaffle();
        if (!lastFinished) return { error: new Error('No hay rifa finalizada para archivar.') };

        const { error } = await supabase
            .from('rifas')
            .update({ estado: 'archivada' })
            .eq('id', lastFinished.id);

        if (error) return { error: new Error(error.message) };
        return { error: null };
    }
}

export const mockStore = new Store();
