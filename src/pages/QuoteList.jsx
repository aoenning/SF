import { generateQuotePDF } from '../utils/pdfGenerator';
import { Printer, Smartphone, X } from 'lucide-react';

const QuoteList = () => {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [logoBase64, setLogoBase64] = useState(null);

    useEffect(() => {
        // Preload logo for PDF
        const loadImage = async () => {
            try {
                const response = await fetch('/logo.png');
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    setLogoBase64(reader.result);
                };
                reader.readAsDataURL(blob);
            } catch (e) {
                console.error("Failed to load logo for PDF", e);
            }
        };
        loadImage();

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

    const getFormattedData = (quote) => ({
        ...quote,
        date: quote.createdAt?.seconds ? new Date(quote.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
        // Ensure numbers are preserved properly if needed, but quote usually has them
        laborCost: quote.laborCost || 0,
        materialCost: quote.materialCost || 0,
        total: quote.total
    });

    const handleGeneratePDF = (e, quote) => {
        e.stopPropagation();
        const data = getFormattedData(quote);
        const doc = generateQuotePDF(data, logoBase64);
        doc.save(`Orcamento_${data.clientName.replace(/\s+/g, '_')}.pdf`);
    };

    const handleSendWhatsApp = async (e, quote) => {
        e.stopPropagation();
        const data = getFormattedData(quote);

        // 1. Try to share PDF file directly (Mobile)
        try {
            const doc = generateQuotePDF(data, logoBase64);
            const pdfBlob = doc.output('blob');
            const file = new File([pdfBlob], `Orcamento_${data.clientName.replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Orçamento Serralheria Fazzer',
                    text: `Olá ${data.clientName}, segue em anexo o seu orçamento.`,
                });
                return;
            }
        } catch (error) {
            console.log("Sharing failed or not supported, falling back to text", error);
        }

        // 2. Fallback
        const text = `*Olá ${data.clientName}!*\n\nAqui está o seu orçamento da *Serralheria Fazzer*:\n\n*Serviço:* ${data.serviceDescription}\n*Total:* R$ ${data.total}\n\n_O arquivo PDF do orçamento foi baixado no seu dispositivo para que você possa enviá-lo._`;

        // Download PDF for user to attach
        const doc = generateQuotePDF(data, logoBase64);
        doc.save(`Orcamento_${data.clientName.replace(/\s+/g, '_')}.pdf`);

        const url = `https://wa.me/${quote.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

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
                            onClick={() => setSelectedQuote(quote)}
                            className="bg-premium-gray border border-gray-800 rounded-xl p-6 hover:border-premium-red/50 transition-colors group relative overflow-hidden cursor-pointer"
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

                            <div className="flex items-center justify-between pt-4 border-t border-gray-800 mb-4">
                                <span className="text-gray-500 text-sm">Total</span>
                                <span className="text-xl font-bold text-premium-red flex items-center">
                                    <span className="text-xs mr-1">R$</span> {quote.total}
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => handleGeneratePDF(e, quote)}
                                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white py-2 rounded-lg text-xs font-medium border border-gray-700 flex items-center justify-center gap-1 transition-colors"
                                >
                                    <Printer size={14} /> PDF
                                </button>
                                <button
                                    onClick={(e) => handleSendWhatsApp(e, quote)}
                                    className="flex-1 bg-green-900/30 hover:bg-green-900/50 text-green-400 hover:text-green-300 py-2 rounded-lg text-xs font-medium border border-green-900/50 flex items-center justify-center gap-1 transition-colors"
                                >
                                    <Smartphone size={14} /> Whats
                                </button>
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

            {/* Quote Details Modal */}
            {selectedQuote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedQuote(null)}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-premium-gray border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-zinc-900">
                            <h3 className="text-xl font-bold text-white">Detalhes do Orçamento</h3>
                            <button onClick={() => setSelectedQuote(null)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wider">Cliente</label>
                                    <p className="text-white font-medium">{selectedQuote.clientName}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wider">Telefone</label>
                                    <p className="text-white font-medium">{selectedQuote.clientPhone}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wider">Descrição</label>
                                <p className="text-gray-300 mt-1 p-3 bg-black/20 rounded-lg">{selectedQuote.serviceDescription}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4 border-t border-gray-800 pt-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wider">Mão de Obra</label>
                                    <p className="text-white">R$ {parseFloat(selectedQuote.laborCost).toFixed(2)}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wider">Materiais</label>
                                    <p className="text-white">R$ {parseFloat(selectedQuote.materialCost).toFixed(2)}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wider">Qtd</label>
                                    <p className="text-white">{selectedQuote.quantity}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-gray-800 mt-4">
                                <span className="text-gray-400 font-medium">Total</span>
                                <span className="text-3xl font-bold text-premium-red">R$ {selectedQuote.total}</span>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-800 bg-zinc-900 flex gap-3">
                            <button
                                onClick={(e) => handleGeneratePDF(e, selectedQuote)}
                                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-bold border border-gray-700 flex items-center justify-center gap-2 transition-all"
                            >
                                <Printer size={18} /> PDF
                            </button>
                            <button
                                onClick={(e) => handleSendWhatsApp(e, selectedQuote)}
                                className="flex-1 bg-[#25D366] hover:bg-[#1ebc59] text-white py-3 rounded-xl font-bold shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition-all"
                            >
                                <Smartphone size={18} /> WhatsApp
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default QuoteList;
