import { supabase } from "./supabase";

export type Raffle = {
    id: string;
    nombre: string;
    descripcion: string;
    fotos: string[];
    precio_boleto: number;
    total_boletos: number;
    giro_ganador: number; // 3, 4 or 5
    estado: 'activa' | 'finalizada';
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
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) return null;
        return data as Raffle;
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
                estado: 'apartado'
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
        // Technically we just update the active raffle to 'finalizada' so it's not active anymore
        // Or we can delete it depending on logic. Let's just finalize it without winner to hide it
        const activeRaffle = await this.getActiveRaffle();
        if (activeRaffle) {
            await supabase
                .from('rifas')
                .update({ estado: 'finalizada', ganador_nombre: 'Cancelada' })
                .eq('id', activeRaffle.id);
        }
    }
}

export const mockStore = new Store();
