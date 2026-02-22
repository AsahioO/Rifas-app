"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Image as ImageIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { mockStore, type Raffle } from "@/lib/store";
import { supabase } from "@/lib/supabase";

function RaffleForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('id');

    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(!!editId);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        nombre: "",
        descripcion: "",
        regalo_incluido: "",
        precio_boleto: "20",
        total_boletos: "100",
        giro_ganador: "5",
    });
    const [valorProducto, setValorProducto] = useState<string>("");
    const [submitTo, setSubmitTo] = useState<'activa' | 'borrador'>('activa');
    const [isDrafting, setIsDrafting] = useState(false);

    const [files, setFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

    const [giftFiles, setGiftFiles] = useState<File[]>([]);
    const [giftPreviewUrls, setGiftPreviewUrls] = useState<string[]>([]);
    const [existingGiftImageUrls, setExistingGiftImageUrls] = useState<string[]>([]);

    useEffect(() => {
        async function loadDraft() {
            if (editId) {
                const draft = await mockStore.getRaffleById(editId);
                if (draft) {
                    setFormData({
                        nombre: draft.nombre,
                        descripcion: draft.descripcion,
                        regalo_incluido: draft.regalo_incluido || "",
                        precio_boleto: draft.precio_boleto.toString(),
                        total_boletos: draft.total_boletos.toString(),
                        giro_ganador: draft.giro_ganador.toString(),
                    });
                    if (draft.fotos && draft.fotos.length > 0) {
                        setExistingImageUrls(draft.fotos);
                        setPreviewUrls(draft.fotos);
                    }
                    if (draft.fotos_regalo && draft.fotos_regalo.length > 0) {
                        setExistingGiftImageUrls(draft.fotos_regalo);
                        setGiftPreviewUrls(draft.fotos_regalo);
                    }
                } else {
                    setError("No se pudo cargar el borrador especificado.");
                }
                setInitializing(false);
            }
        }
        loadDraft();
    }, [editId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...selectedFiles]);

            const newUrls = selectedFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newUrls]);
        }
    };

    const removeFile = (index: number) => {
        // If we're removing an existing image, we need to track that it's removed
        if (index < existingImageUrls.length) {
            setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
        } else {
            // If it's a new file, remove it from the files array
            const fileIndex = index - existingImageUrls.length;
            setFiles(prev => prev.filter((_, i) => i !== fileIndex));
        }
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleGiftFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            setGiftFiles(prev => [...prev, ...selectedFiles]);
            const newUrls = selectedFiles.map(file => URL.createObjectURL(file));
            setGiftPreviewUrls(prev => [...prev, ...newUrls]);
        }
    };

    const removeGiftFile = (index: number) => {
        if (index < existingGiftImageUrls.length) {
            setExistingGiftImageUrls(prev => prev.filter((_, i) => i !== index));
        } else {
            const fileIndex = index - existingGiftImageUrls.length;
            setGiftFiles(prev => prev.filter((_, i) => i !== fileIndex));
        }
        setGiftPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (submitTo === 'borrador') {
            setIsDrafting(true);
        }
        setError("");

        let imageUrls: string[] = [...existingImageUrls];

        if (files.length > 0) {
            for (const file of files) {
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

                imageUrls.push(publicUrlData.publicUrl);
            }
        }

        // If no images at all, provide a default
        if (imageUrls.length === 0) {
            imageUrls = ["https://images.unsplash.com/photo-1603792907191-89e55f70099a?q=80&w=2670&auto=format&fit=crop"];
        }

        let giftImageUrls: string[] = [...existingGiftImageUrls];

        if (giftFiles.length > 0) {
            for (const file of giftFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `regalo_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
                const filePath = `premios/${fileName}`;
                const { error: uploadError } = await supabase.storage.from('rifas-images').upload(filePath, file);

                if (uploadError) {
                    setError("Error al subir imagen de regalo: " + uploadError.message);
                    setLoading(false);
                    return;
                }
                const { data: publicUrlData } = supabase.storage.from('rifas-images').getPublicUrl(filePath);
                giftImageUrls.push(publicUrlData.publicUrl);
            }
        }

        const { precio_boleto, total_boletos, giro_ganador, ...rest } = formData;

        const payload = {
            ...rest,
            precio_boleto: Number(precio_boleto),
            total_boletos: Number(total_boletos),
            giro_ganador: Number(giro_ganador),
            fotos: imageUrls,
            ...(giftImageUrls.length > 0 ? { fotos_regalo: giftImageUrls } : {})
        } as Partial<Raffle> & { estado?: 'activa' | 'borrador' };

        if (!payload.regalo_incluido || payload.regalo_incluido.trim() === "") {
            // Send empty string if cleared, so DB unsets it
            payload.regalo_incluido = null as any; // hack to allow null in Partial<Raffle>
            payload.fotos_regalo = [];
        }

        let storeError = null;

        if (editId) {
            payload.estado = submitTo; // Apply the chosen mode (publish or keep as draft)
            const result = await mockStore.updateRaffle(editId, payload);
            storeError = result.error;
        } else {
            const result = await mockStore.createRaffle(payload as any, submitTo);
            storeError = result.error;
        }

        setLoading(false);
        setIsDrafting(false);

        if (storeError) {
            setError(storeError.message);
        } else {
            router.push("/admin");
        }
    };

    if (initializing) {
        return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Link href="/admin" className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-syne font-bold">{editId ? 'Editar Rifa (Borrador)' : 'Crear Nueva Rifa'}</h1>
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
                        <label className="text-sm font-medium text-white/80">¿Incluye un Regalo Sorpresa/Extra? <span className="text-white/40 text-xs">(Opcional)</span></label>
                        <input
                            name="regalo_incluido"
                            value={formData.regalo_incluido}
                            onChange={handleChange}
                            className="w-full bg-black/40 border border-blue-500/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            placeholder="Ej: Funda protectora de regalo 🎁"
                        />
                        <p className="text-xs text-blue-400">Si lo llenas, destacará en la página como un premio adicional.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">Imágenes Reales del Premio (Múltiples permitidas)</label>
                        <div className="relative border-2 border-dashed border-white/10 rounded-xl p-4 sm:p-6 flex flex-col justify-center items-center text-center bg-black/20 hover:bg-white/5 transition-colors group min-h-[200px]">
                            {previewUrls.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full p-2">
                                    {previewUrls.map((url, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group/item border border-white/10 shadow-lg">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFile(idx); }}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center w-7 h-7 hover:scale-110 shadow-lg"
                                                title="Eliminar Foto"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                    <div className="relative aspect-square rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-muted-foreground hover:text-white hover:border-white/50 transition-colors cursor-pointer bg-white/5">
                                        <ImageIcon className="w-8 h-8 mb-1" />
                                        <span className="text-xs">Añadir más</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <ImageIcon className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                                    <p className="text-sm">Haz clic aquí para subir fotos geniales de la rifa.</p>
                                    <p className="text-xs text-muted-foreground mt-1">Soporta múltiples archivos JPG o PNG.</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {formData.regalo_incluido && formData.regalo_incluido.trim() !== "" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <label className="text-sm font-medium text-pink-300">Imágenes del Regalo Extra</label>
                            <div className="relative border-2 border-dashed border-pink-500/30 rounded-xl p-4 sm:p-6 flex flex-col justify-center items-center text-center bg-pink-500/5 hover:bg-pink-500/10 transition-colors group min-h-[150px]">
                                {giftPreviewUrls.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full p-2">
                                        {giftPreviewUrls.map((url, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group/item border border-pink-500/30 shadow-lg">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={url} alt={`Preview Regalo ${idx}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeGiftFile(idx); }}
                                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center w-7 h-7 hover:scale-110 shadow-lg"
                                                    title="Eliminar Foto"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                        <div className="relative aspect-square rounded-lg border-2 border-dashed border-pink-500/40 flex flex-col items-center justify-center text-pink-300/60 hover:text-pink-300 hover:border-pink-500/60 transition-colors cursor-pointer bg-pink-500/10">
                                            <ImageIcon className="w-8 h-8 mb-1" />
                                            <span className="text-xs">Añadir más</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleGiftFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <ImageIcon className="w-8 h-8 text-pink-400 group-hover:text-pink-300 transition-colors mb-2" />
                                        <p className="text-sm text-pink-200">Añade fotos para presumir el regalo extra.</p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleGiftFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Calculadora Inteligente */}
                <div className="space-y-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="text-6xl">💡</span>
                    </div>
                    <h2 className="text-lg font-bold font-syne text-emerald-400 border-b border-emerald-500/20 pb-2 relative z-10">
                        Calculadora Inteligente de Precios
                    </h2>
                    <p className="text-sm text-emerald-200/70 relative z-10">
                        Calcula automáticamente la rentabilidad de tu rifa. (Este dato es privado y no se muestra a los usuarios).
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-emerald-300">Valor Real del Producto ($)</label>
                            <input
                                type="number"
                                min={0} step="0.01"
                                value={valorProducto}
                                onChange={(e) => setValorProducto(e.target.value)}
                                className="w-full bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-100 placeholder-emerald-900/50"
                                placeholder="Costo invertido"
                            />
                        </div>

                        {valorProducto !== "" && Number(valorProducto) > 0 && Number(formData.total_boletos) > 0 ? (
                            <>
                                <div className="space-y-1 pt-2 sm:pt-8 bg-black/20 rounded-xl px-4 py-2 border border-white/5 disabled opacity-80">
                                    <p className="text-xs text-emerald-300/70 uppercase tracking-wider">Precio Sugerido (Empate)</p>
                                    <p className="text-xl font-bold font-syne text-white">
                                        ${(Number(valorProducto) / Number(formData.total_boletos)).toFixed(2)}
                                    </p>
                                </div>
                                <div className="space-y-1 pt-2 sm:pt-8 bg-black/20 rounded-xl px-4 py-2 border border-white/5">
                                    <p className="text-xs text-emerald-300/70 uppercase tracking-wider">Ganancia Libre</p>
                                    <p className="text-xl font-bold font-syne text-emerald-400">
                                        ${((Number(formData.precio_boleto) * Number(formData.total_boletos)) - Number(valorProducto)).toFixed(2)}
                                    </p>
                                </div>
                                <div className="space-y-1 pt-2 sm:pt-8 bg-black/20 rounded-xl px-4 py-2 border border-white/5">
                                    <p className="text-xs text-emerald-300/70 uppercase tracking-wider">Margen de Utilidad</p>
                                    <p className="text-xl font-bold font-syne text-emerald-400">
                                        {(((Number(formData.precio_boleto) * Number(formData.total_boletos)) - Number(valorProducto)) / (Number(formData.precio_boleto) * Number(formData.total_boletos)) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </>
                        ) : null}
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

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4">
                    <Link href="/admin" className="px-6 py-3 rounded-xl font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors order-3 sm:order-none w-full sm:w-auto text-center mt-2 sm:mt-0">
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        onClick={() => setSubmitTo('borrador')}
                        disabled={loading}
                        className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-all font-medium flex items-center justify-center gap-2 border border-white/10 disabled:opacity-50 order-2 sm:order-none"
                    >
                        {loading && isDrafting && <Loader2 className="w-5 h-5 animate-spin" />}
                        Guardar como Borrador
                    </button>
                    <button
                        type="submit"
                        onClick={() => setSubmitTo('activa')}
                        disabled={loading}
                        className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 order-1 sm:order-none"
                    >
                        {loading && !isDrafting && <Loader2 className="w-5 h-5 animate-spin" />}
                        Publicar Rifa
                    </button>
                </div>

            </form>
        </div>
    );
}

export default function NuevaRifaPage() {
    return (
        <Suspense fallback={<div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <RaffleForm />
        </Suspense>
    );
}
