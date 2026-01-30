import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-premium-black"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="relative flex flex-col items-center">
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 1, ease: 'backOut' }}
                    className="relative mb-6"
                >
                    <div className="absolute inset-0 bg-premium-red blur-xl opacity-20 rounded-full w-48 h-32 ml-[-1rem] mt-[-1rem]"></div>
                    <div className="relative z-10 p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex items-center justify-center">
                        <div className="w-64 h-32 relative">
                            <img src="/logo.png" alt="Serralheria Fazzer" className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100px' }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="h-1 bg-premium-red mt-4 rounded-full"
                />
            </div>
        </motion.div>
    );
};

export default SplashScreen;
