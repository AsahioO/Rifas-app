"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Image as ImageIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { mockStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export default function NuevaRifaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        nombre: "",
        descripcion: "",
        precio_boleto: 20,
        total_boletos: 100,
        giro_ganador: 5,
    });

    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ["precio_boleto", "total_boletos", "giro_ganador"].includes(name)
                ? Number(value)
                : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        let imageUrl = "https://images.unsplash.com/photo-1603792907191-89e55f70099a?q=80&w=2670&auto=format&fit=crop";

        if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
            const filePath = `premios/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('rifas-images')
                .upload(filePath, file);

            if (uploadError) {
                setError("Error al subir imagen. ¿Creaste el Cubo (Bucket) 'rifas-images' en Supabase?: " + uploadError.message);
                setLoading(false);
                return;
            }

            const { data: publicUrlData } = supabase.storage
                .from('rifas-images')
                .getPublicUrl(filePath);

            imageUrl = publicUrlData.publicUrl;
        }

        const { error: storeError } = await mockStore.createRaffle({
            ...formData,
            fotos: [imageUrl],
        });

        setLoading(false);

        if (storeError) {
            setError(storeError.message);
        } else {
            router.push("/admin");
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Link href="/admin" className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-syne font-bold">Crear Nueva Rifa</h1>
                    <p className="text-muted-foreground">Configura los detalles del premio y el boletaje.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-3xl space-y-8">

                {/* Info Principal */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold font-syne border-b border-white/10 pb-2">Información del Premio</h2>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">Nombre del Producto o Premio</label>
                        <input
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Ej: iPhone 15 Pro Max 256GB"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">Descripción</label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            required
                            rows={4}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            placeholder="Detalles sobre el producto, bases o términos rápidos."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">Imagen Principal del Premio</label>
                        <div className="relative border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col justify-center items-center text-center bg-black/20 hover:bg-white/5 transition-colors cursor-pointer overflow-hidden group">
                            {previewUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            ) : (
                                <>
                                    <ImageIcon className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                                    <p className="text-sm">Haz clic aquí para subir una foto representativa genial de la rifa.</p>
                                    <p className="text-xs text-muted-foreground mt-1">Archivos JPG o PNG.</p>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                        </div>
                    </div>
                </div>

                {/* Configuracion Boletos */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold font-syne border-b border-white/10 pb-2">Ventas y Boletos</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/80">Total de Boletos Generados</label>
                            <input
                                name="total_boletos"
                                type="number"
                                min={10} max={1000}
                                value={formData.total_boletos}
                                onChange={handleChange}
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <p className="text-xs text-muted-foreground">Esto crea automáticamente la cuadrícula (Ej: 100).</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/80">Precio por Boleto ($)</label>
                            <input
                                name="precio_boleto"
                                type="number"
                                min={1} step="0.5"
                                value={formData.precio_boleto}
                                onChange={handleChange}
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>

                {/* Sorteo Lógica */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold font-syne border-b border-white/10 pb-2">Lógica del Sorteo Vivo</h2>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">Dinámica: ¿En qué giro cae el premio?</label>
                        <select
                            name="giro_ganador"
                            value={formData.giro_ganador}
                            onChange={handleChange}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                        >
                            <option value={3}>El 3er papelito/giro se lo lleva (2 eliminados)</option>
                            <option value={4}>El 4to papelito/giro se lo lleva (3 eliminados)</option>
                            <option value={5}>El 5to papelito/giro se lo lleva (4 eliminados)</option>
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
                        {error}
                    </div>
                )}

                <div className="pt-4 flex items-center justify-end gap-4">
                    <Link href="/admin" className="px-6 py-3 rounded-xl font-medium hover:bg-white/5 transition-colors">
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                        Guardar y Publicar
                    </button>
                </div>

            </form>
        </div>
    );
}
