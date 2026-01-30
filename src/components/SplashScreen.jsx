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
                    <div className="flex items-center justify-center w-64 h-32 p-4">
                        <img src="/logo.png" alt="Serralheria Fazzer" className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(217,4,41,0.5)]" />
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
