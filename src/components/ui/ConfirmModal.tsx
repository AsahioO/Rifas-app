"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, HelpCircle } from "lucide-react";

interface ConfirmModalProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({
    open,
    title,
    message,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    danger = false,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[61] flex items-end sm:items-center justify-center p-4 sm:p-0 pointer-events-none">
                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="bg-brand-surface w-full sm:max-w-md rounded-2xl shadow-2xl border border-brand-border pointer-events-auto overflow-hidden pb-safe"
                        >
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`flex-shrink-0 p-3 rounded-full ${danger ? "bg-red-50 text-red-600" : "bg-brand-accent/10 text-brand-accent"
                                            }`}
                                    >
                                        {danger ? <AlertTriangle className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-1 mt-1 text-left">
                                        <h3 className="text-lg font-serif font-semibold text-brand-text mb-2">
                                            {title}
                                        </h3>
                                        <p className="text-sm text-brand-muted leading-relaxed">
                                            {message}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="bg-brand-bg/50 px-6 py-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-brand-border">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onCancel}
                                    className="px-4 py-2 text-sm font-medium text-brand-muted hover:text-brand-text rounded-lg border border-brand-border hover:border-brand-text/30 bg-brand-surface transition-colors w-full sm:w-auto"
                                >
                                    {cancelLabel}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onConfirm}
                                    className={`px-5 py-2 text-sm font-medium rounded-lg shadow-sm w-full sm:w-auto transition-colors ${danger
                                            ? "bg-red-500 text-white hover:bg-red-600"
                                            : "bg-brand-text text-brand-surface hover:bg-brand-wine"
                                        }`}
                                >
                                    {confirmLabel}
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
