import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react';

const CustomAlert = ({ isOpen, onClose, title, message, type = 'info', onConfirm }) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={32} className="text-green-500" />;
            case 'error': return <AlertCircle size={32} className="text-red-500" />;
            case 'warning': return <AlertTriangle size={32} className="text-yellow-500" />;
            default: return <Info size={32} className="text-blue-500" />;
        }
    };

    const getBorderColor = () => {
        switch (type) {
            case 'success': return 'border-green-500/50';
            case 'error': return 'border-red-500/50';
            case 'warning': return 'border-yellow-500/50';
            default: return 'border-blue-500/50';
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className={`bg-[#1a1a1a] border ${getBorderColor()} w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden`}
                >
                    <div className="p-6 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-white/5 rounded-full">
                                {getIcon()}
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                        <p className="text-gray-400 mb-6">{message}</p>

                        <div className="flex gap-3 justify-center">
                            {onConfirm ? (
                                <>
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 font-medium transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => { onConfirm(); onClose(); }}
                                        className="flex-1 px-4 py-2 rounded-xl bg-premium-red text-white hover:bg-red-700 font-bold transition-colors"
                                    >
                                        Confirmar
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={onClose}
                                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 font-bold transition-colors"
                                >
                                    OK
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CustomAlert;
