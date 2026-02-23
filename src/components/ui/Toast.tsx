"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
}

// Global state for toasts
let addToastHandler: (toast: Omit<ToastProps, "id">) => void = () => { };

export const showToast = (message: string, type: ToastType = "info") => {
    addToastHandler({ message, type });
};

export function ToastContainer() {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    useEffect(() => {
        addToastHandler = ({ message, type }) => {
            const id = Math.random().toString(36).substring(2, 9);
            setToasts((prev) => [...prev, { id, message, type }]);

            // Auto dismiss
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 4000);
        };
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-sm">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
                ))}
            </AnimatePresence>
        </div>
    );
}

function ToastItem({ toast, onRemove }: { toast: ToastProps; onRemove: () => void }) {
    const config = {
        success: { bg: "bg-emerald-50", border: "border-emerald-200", icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" /> },
        error: { bg: "bg-red-50", border: "border-red-200", icon: <AlertTriangle className="w-5 h-5 text-red-600" /> },
        info: { bg: "bg-brand-accent/10", border: "border-brand-accent/20", icon: <Info className="w-5 h-5 text-brand-accent" /> },
    };

    const { bg, border, icon } = config[toast.type];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`pointer-events-auto flex items-start p-4 rounded-xl shadow-lg border ${bg} ${border}`}
        >
            <div className="flex-shrink-0 mt-0.5">{icon}</div>
            <div className="ml-3 mr-4 flex-1">
                <p className="text-sm font-medium text-brand-text">{toast.message}</p>
            </div>
            <button
                onClick={onRemove}
                className="flex-shrink-0 text-brand-muted hover:text-brand-text transition-colors p-1 rounded-md"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}
