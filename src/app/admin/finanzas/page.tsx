"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { DollarSign, TrendingUp, Calendar, Wallet } from "lucide-react";
import { mockStore } from "@/lib/store";

const COLORS = {
    pagados: "#10b981", // Emerald 500
    disponibles: "#3b82f6", // Blue 500
};

export default function FinanzasPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Awaited<ReturnType<typeof mockStore.getFinancialStats>> | null>(null);
    const [dailyData, setDailyData] = useState<{ name: string, ingresos: number }[]>([]);

    useEffect(() => {
        const loadData = async () => {
            const financialStats = await mockStore.getFinancialStats();
            if (financialStats) {
                setStats(financialStats);

                // Procesar datos para la gráfica de Área (Ventas por día)
                const participants = await mockStore.getParticipants();
                const daysMap = new Map();

                participants.forEach(p => {
                    const day = format(parseISO(p.created_at), 'MMM dd', { locale: es });
                    const amount = p.boletos.length * financialStats.precioBoleto;
                    if (!daysMap.has(day)) {
                        daysMap.set(day, { name: day, ingresos: 0 });
                    }
                    daysMap.get(day).ingresos += amount;
                });

                // Convert map to array and reverse to chronological order if needed
                const chartData = Array.from(daysMap.values()).reverse();
                // Si no hay suficientes datos para generar una linea chida, agregamos uno dummy inicial
                if (chartData.length === 1) {
                    chartData.unshift({ name: 'Inicio', ingresos: 0 });
                }
                setDailyData(chartData);
            }
            setLoading(false);
        };
        loadData();
    }, []);

    if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground font-syne">Analizando datos financieros...</div>;

    if (!stats) return (
        <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-muted-foreground mb-6">
                <Wallet className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-syne font-bold">Sin datos financieros</h2>
            <p className="text-muted-foreground mt-4 max-w-sm">No hay una rifa activa para calcular finanzas. Crea una rifa para comenzar a recolectar analíticas.</p>
        </div>
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    const boletosDisponibles = stats.totalBoletos - stats.boletosVendidos;

    const pieData = [
        { name: 'Vendidos', value: stats.boletosVendidos, color: COLORS.pagados },
        { name: 'Disponibles', value: boletosDisponibles, color: COLORS.disponibles },
    ];

    const progresoVentas = ((stats.boletosVendidos / stats.totalBoletos) * 100).toFixed(1);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-syne font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">
                        Inteligencia Financiera
                    </h1>
                    <p className="text-muted-foreground mt-1">Análisis de rentabilidad y proyecciones de tu sorteo activo.</p>
                </div>
                <div className="glass-panel px-6 py-3 rounded-full border-emerald-500/20 text-emerald-400 font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Progreso Real: {progresoVentas}%
                </div>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group border-emerald-500/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-colors" />
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-muted-foreground font-medium">Ingresos Brutos</h3>
                        <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-500 ring-1 ring-emerald-500/30">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-5xl font-bold font-syne text-emerald-50">{formatCurrency(stats.ingresosBrutos)}</h2>
                        <p className="text-sm text-emerald-500/80 mt-2 font-medium">Dinero real ingresado (boletos pagados)</p>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group border-blue-500/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-colors" />
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-muted-foreground font-medium">Proyección Máxima</h3>
                        <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-500 ring-1 ring-blue-500/30">
                            <Wallet className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-5xl font-bold font-syne text-blue-50">{formatCurrency(stats.ingresosProyectados)}</h2>
                        <p className="text-sm text-blue-500/80 mt-2 font-medium">Si el boletaje se agota (Sould out)</p>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Evolution Chart */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border-white/5 flex flex-col min-h-[400px]">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-syne font-bold">Evolución de Ingresos</h3>
                            <p className="text-sm text-muted-foreground">Flujo de dinero por boletos pagados en el tiempo</p>
                        </div>
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 w-full relative">
                        {dailyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#ffffff50"
                                        tick={{ fill: '#ffffff80', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#ffffff50"
                                        tick={{ fill: '#ffffff80', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `$${val}`}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff20', borderRadius: '12px' }}
                                        itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                                        formatter={(value: unknown) => [formatCurrency(value as number), "Ingresos"]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="ingresos"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorIngresos)"
                                        activeDot={{ r: 6, fill: "#10b981", stroke: "#000", strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground italic">
                                Esperando las primeras ventas para trazar la curva...
                            </div>
                        )}
                    </div>
                </div>

                {/* Distribution Chart */}
                <div className="glass-panel p-6 rounded-3xl border-white/5 flex flex-col">
                    <div className="mb-2">
                        <h3 className="text-xl font-syne font-bold">Distribución de Boletos</h3>
                        <p className="text-sm text-muted-foreground">Estado actual del boletaje</p>
                    </div>
                    <div className="flex-1 min-h-[250px] relative mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff20', borderRadius: '12px' }}
                                    itemStyle={{ color: 'white', fontWeight: 'bold' }}
                                    formatter={(value: unknown) => [`${value} boletos`, "Cantidad"]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center text for the donut chart */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
                            <span className="text-3xl font-bold font-syne text-white">{stats.totalBoletos}</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-widest">Total</span>
                        </div>
                    </div>
                    <div className="space-y-3 mt-4">
                        {pieData.map((d, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                    <span className="text-sm font-medium text-white/80">{d.name}</span>
                                </div>
                                <span className="font-syne font-bold text-sm bg-white/5 px-3 py-1 rounded-lg">
                                    {((d.value / stats.totalBoletos) * 100).toFixed(0)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
