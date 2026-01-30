import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { FileText, Calendar, DollarSign, Search } from 'lucide-react';

const QuoteList = () => {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchQuotes = async () => {
            try {
                const q = query(collection(db, "quotes"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setQuotes(docs);
            } catch (error) {
                console.error("Error fetching quotes: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuotes();
    }, []);

    const filteredQuotes = quotes.filter(quote =>
        quote.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.serviceDescription.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-800 pb-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Meus Orçamentos</h2>
                    <p className="text-gray-400">Gerencie todos os orçamentos emitidos.</p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar orçamentos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-premium-gray border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-premium-red focus:outline-none placeholder-gray-600"
                    />
                </div>
            </header>

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin w-12 h-12 border-4 border-premium-red border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Carregando orçamentos...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredQuotes.map((quote, index) => (
                        <motion.div
                            key={quote.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-premium-gray border border-gray-800 rounded-xl p-6 hover:border-premium-red/50 transition-colors group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-premium-red to-red-900 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-red-900/20 transition-colors">
                                    <FileText className="text-gray-400 group-hover:text-premium-red transition-colors" />
                                </div>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Calendar size={12} />
                                    {quote.createdAt?.seconds
                                        ? new Date(quote.createdAt.seconds * 1000).toLocaleDateString()
                                        : new Date().toLocaleDateString()}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-1 truncate">{quote.clientName}</h3>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2 h-10">{quote.serviceDescription}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                                <span className="text-gray-500 text-sm">Total</span>
                                <span className="text-xl font-bold text-premium-red flex items-center">
                                    <span className="text-xs mr-1">R$</span> {quote.total}
                                </span>
                            </div>
                        </motion.div>
                    ))}

                    {filteredQuotes.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-premium-gray/50 rounded-xl border border-gray-800 border-dashed">
                            <p className="text-gray-500">Nenhum orçamento encontrado.</p>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default QuoteList;
