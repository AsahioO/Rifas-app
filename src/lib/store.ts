import { supabase } from "./supabase";

export type Raffle = {
    id: string;
    nombre: string;
    descripcion: string;
    regalo_incluido?: string;
    fotos: string[];
    fotos_regalo?: string[];
    precio_boleto: number;
    total_boletos: number;
    giro_ganador: number; // 3, 4 or 5
    estado: 'activa' | 'finalizada' | 'archivada' | 'borrador';
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
            .maybeSingle();

        if (error || !data) return null;
        return data as Raffle;
    }

    async getLastFinishedRaffle(): Promise<Raffle | null> {
        const { data, error } = await supabase
            .from('rifas')
            .select('*')
            .in('estado', ['finalizada', 'archivada'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !data) return null;
        if (data.estado === 'archivada') return null;
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

    async getDraftRaffles(): Promise<Raffle[]> {
        const { data, error } = await supabase
            .from('rifas')
            .select('*')
            .eq('estado', 'borrador')
            .order('created_at', { ascending: false });

        if (error || !data) return [];
        return data as Raffle[];
    }

    async getParticipants(activeRaffleId?: string): Promise<Participant[]> {
        let raffleId = activeRaffleId;
        if (!raffleId) {
            const activeRaffle = await this.getActiveRaffle();
            if (!activeRaffle) return [];
            raffleId = activeRaffle.id;
        }

        const { data, error } = await supabase
            .from('participantes')
            .select('*')
            .eq('rifa_id', raffleId)
            .order('created_at', { ascending: false });

        if (error || !data) return [];
        return data as Participant[];
    }

    async getTakenTickets(activeRaffleId?: string): Promise<number[]> {
        const participants = await this.getParticipants(activeRaffleId);
        return participants.flatMap(p => p.boletos);
    }

    async getFinancialStats(): Promise<{
        ingresosBrutos: number;
        ingresosProyectados: number;
        boletosVendidos: number;
        totalBoletos: number;
        precioBoleto: number;
        participants: Participant[];
    } | null> {
        const activeRaffle = await this.getActiveRaffle();
        if (!activeRaffle) return null;

        const participants = await this.getParticipants(activeRaffle.id);

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
            precioBoleto: precio,
            participants
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

    async getRaffleById(id: string): Promise<Raffle | null> {
        const { data, error } = await supabase
            .from('rifas')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.error("Error fetching raffle by id:", error);
            return null;
        }

        return data as unknown as Raffle;
    }

    async createRaffle(data: Omit<Raffle, 'id' | 'estado' | 'created_at'>, estado: 'activa' | 'borrador' = 'activa'): Promise<{ data: Raffle | null, error: Error | null }> {
        if (estado === 'activa') {
            const currentActive = await this.getActiveRaffle();
            if (currentActive && currentActive.estado === 'activa') {
                return { data: null, error: new Error("Ya existe una rifa activa. Termínala primero para poder publicar una nueva.") };
            }
        }

        const { data: newRaffle, error } = await supabase
            .from('rifas')
            .insert([{ ...data, estado }])
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

        return this.updateRaffle(currentActive.id, updates);
    }

    async updateRaffle(id: string, updates: Partial<Raffle>): Promise<{ data: Raffle | null, error: Error | null }> {
        if (updates.estado === 'activa') {
            const currentActive = await this.getActiveRaffle();
            if (currentActive && currentActive.id !== id) {
                return { data: null, error: new Error("Ya existe una rifa activa. Termínala primero para poder publicar esta.") };
            }
        }

        const { data, error } = await supabase
            .from('rifas')
            .update(updates)
            .eq('id', id)
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

        const taken = await this.getTakenTickets(activeRaffle.id);
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
