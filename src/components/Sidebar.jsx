import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { PlusCircle, FileText, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                setDeferredPrompt(null);
            });
        }
    };

    const links = [
        { to: '/', label: 'Criar Orçamento', icon: PlusCircle },
        { to: '/orcamentos', label: 'Meus Orçamentos', icon: FileText },
    ];

    return (
        <div className="w-64 h-screen bg-premium-gray border-r border-gray-800 flex flex-col fixed left-0 top-0 z-10 shadow-2xl">
            <div className="p-8 flex items-center justify-center border-b border-gray-800 bg-gradient-to-b from-premium-gray to-[#151515]">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-2"
                >
                    <div className="w-24 h-16 flex items-center justify-center overflow-hidden">
                        <img src="/logo.png" alt="Serralheria Fazzer" className="w-full h-full object-contain" />
                    </div>
                </motion.div>
            </div>

            <nav className="flex-1 py-8 px-4 flex flex-col gap-2">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-300 group ${isActive
                                ? 'bg-gradient-to-r from-premium-red to-red-700 text-white shadow-lg shadow-red-900/20'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`
                        }
                    >
                        <link.icon size={20} className="transition-transform group-hover:scale-110" />
                        <span className="font-medium">{link.label}</span>
                    </NavLink>
                ))}

                {deferredPrompt && (
                    <button
                        onClick={handleInstallClick}
                        className="flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-300 text-gray-400 hover:bg-gray-800 hover:text-white mt-4 border border-gray-700"
                    >
                        <Download size={20} />
                        <span className="font-medium">Instalar App</span>
                    </button>
                )}
            </nav>

            <div className="p-4 border-t border-gray-800">
                <p className="text-xs text-center text-gray-600">
                    © 2026 Serralheria Fazzer
                </p>
            </div>
        </div>
    );
};

export default Sidebar;
