import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Printer, Smartphone, DollarSign, User, Phone, Hammer, RefreshCw } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { generateQuotePDF } from '../utils/pdfGenerator';

const CreateQuote = () => {
    const [clientData, setClientData] = useState({
        clientName: '',
        clientPhone: ''
    });

    const [items, setItems] = useState([]);

    // State for the item currently being added
    const [newItem, setNewItem] = useState({
        description: '',
        quantity: 1,
        laborCost: '',
        materialCost: ''
    });

    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
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
    }, []);

    const calculateTotal = () => {
        return items.reduce((acc, item) => {
            const labor = parseFloat(item.laborCost) || 0;
            const material = parseFloat(item.materialCost) || 0;
            const quantity = parseFloat(item.quantity) || 1;
            return acc + ((labor + material) * quantity);
        }, 0).toFixed(2);
    };

    const handleClientChange = (e) => {
        const { name, value } = e.target;
        setClientData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (e) => {
        const { name, value } = e.target;
        setNewItem(prev => ({ ...prev, [name]: value }));
    };

    const handleAddItem = () => {
        if (!newItem.description || !newItem.laborCost) {
            alert('Descrição e Valor da Mão de Obra são obrigatórios para adicionar um item.');
            return;
        }

        setItems(prev => [...prev, newItem]);
        // Reset item form
        setNewItem({
            description: '',
            quantity: 1,
            laborCost: '',
            materialCost: ''
        });
    };

    const handleRemoveItem = (index) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        // Validate
        if (!clientData.clientName || items.length === 0) {
            alert('Por favor preencha o nome do cliente e adicione pelo menos um item.');
            return;
        }

        setIsSaving(true);
        try {
            await addDoc(collection(db, "quotes"), {
                clientName: clientData.clientName,
                clientPhone: clientData.clientPhone,
                items: items, // Save the array of items
                total: calculateTotal(),
                createdAt: serverTimestamp()
            });

            setSuccessMessage('Orçamento Salvo com Sucesso!');
            setTimeout(() => setSuccessMessage(''), 3000);

            // Optional: reset form after save
            setClientData({ clientName: '', clientPhone: '' });
            setItems([]);
        } catch (error) {
            console.error("Error adding document: ", error);
            alert('Erro ao salvar no banco de dados. Verifique a configuração.');
        } finally {
            setIsSaving(false);
        }
    };

    const getFormattedData = () => ({
        clientName: clientData.clientName,
        clientPhone: clientData.clientPhone,
        items: items,
        total: calculateTotal(),
        date: new Date().toLocaleDateString('pt-BR')
    });

    const handleGeneratePDF = () => {
        if (!clientData.clientName || items.length === 0) {
            alert('Preencha os dados e adicione itens antes de gerar o PDF.');
            return;
        }
        const doc = generateQuotePDF(getFormattedData(), logoBase64);
        doc.save(`Orcamento_${clientData.clientName.replace(/\s+/g, '_')}.pdf`);
    };

    const handleSendWhatsApp = async () => {
        if (!clientData.clientName || items.length === 0) {
            alert('Preencha os dados e adicione itens antes de enviar.');
            return;
        }
        const data = getFormattedData();

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
        } catch (e) {
            console.log("Sharing failed or not supported, falling back to text", e);
        }

        // 2. Fallback: Send Text Message + Download PDF
        let itemsSummary = items.map(item => `• ${item.description} (${item.quantity}x)`).join('\n');

        const text = `*Olá ${clientData.clientName}!*\n\nAqui está o seu orçamento da *Serralheria Fazzer*:\n\n*Serviços:*\n${itemsSummary}\n\n*Total:* R$ ${calculateTotal()}\n\n_O arquivo PDF do orçamento foi baixado no seu dispositivo para que você possa enviá-lo._`;

        // Download PDF for user to attach
        handleGeneratePDF();

        const url = `https://wa.me/${clientData.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-white">Criar Orçamento</h2>
                    <p className="text-gray-400">Preencha os dados abaixo para gerar um novo orçamento.</p>
                </div>
            </header>

            <div className="bg-premium-gray p-8 rounded-2xl border border-gray-800 shadow-2xl space-y-6">
                {/* Client Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <User size={16} className="text-premium-red" /> Nome do Cliente
                        </label>
                        <input
                            type="text"
                            name="clientName"
                            value={clientData.clientName}
                            onChange={handleClientChange}
                            className="w-full bg-premium-light-gray border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-premium-red transition-colors"
                            placeholder="Ex: João da Silva"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Phone size={16} className="text-premium-red" /> Telefone (Whatsapp)
                        </label>
                        <input
                            type="text"
                            name="clientPhone"
                            value={clientData.clientPhone}
                            onChange={handleClientChange}
                            className="w-full bg-premium-light-gray border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-premium-red transition-colors"
                            placeholder="Ex: 11999998888"
                        />
                    </div>
                </div>

                {/* Add Service Item Form */}
                <div className="pt-4 border-t border-gray-800">
                    <h3 className="text-xl font-bold text-white mb-4">Adicionar Serviço/Item</h3>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-black/20 p-4 rounded-xl border border-gray-800">
                        <div className="md:col-span-12">
                            <label className="text-xs text-gray-400 mb-1 block">Descrição do Serviço</label>
                            <textarea
                                name="description"
                                value={newItem.description}
                                onChange={handleItemChange}
                                rows="2"
                                className="w-full bg-premium-light-gray border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-premium-red transition-colors"
                                placeholder="Ex: Instalação de Calha"
                            ></textarea>
                        </div>
                        <div className="md:col-span-3">
                            <label className="text-xs text-gray-400 mb-1 block">Qtd</label>
                            <input
                                type="number"
                                name="quantity"
                                value={newItem.quantity}
                                onChange={handleItemChange}
                                className="w-full bg-premium-light-gray border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-premium-red transition-colors"
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="text-xs text-gray-400 mb-1 block">Mão de Obra (R$)</label>
                            <input
                                type="number"
                                name="laborCost"
                                value={newItem.laborCost}
                                onChange={handleItemChange}
                                className="w-full bg-premium-light-gray border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-premium-red transition-colors"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="text-xs text-gray-400 mb-1 block">Material (R$)</label>
                            <input
                                type="number"
                                name="materialCost"
                                value={newItem.materialCost}
                                onChange={handleItemChange}
                                className="w-full bg-premium-light-gray border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-premium-red transition-colors"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="md:col-span-3 flex items-end">
                            <button
                                onClick={handleAddItem}
                                className="w-full bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <Hammer size={18} /> Adicionar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Items List */}
                {items.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-700 text-gray-400 text-sm">
                                    <th className="py-2">Descrição</th>
                                    <th className="py-2 text-center">Qtd</th>
                                    <th className="py-2 text-center">Mão de Obra</th>
                                    <th className="py-2 text-center">Material</th>
                                    <th className="py-2 text-center">Total Item</th>
                                    <th className="py-2 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {items.map((item, index) => (
                                    <tr key={index} className="text-gray-300">
                                        <td className="py-3">{item.description}</td>
                                        <td className="py-3 text-center">{item.quantity}</td>
                                        <td className="py-3 text-center">R$ {parseFloat(item.laborCost || 0).toFixed(2)}</td>
                                        <td className="py-3 text-center">R$ {parseFloat(item.materialCost || 0).toFixed(2)}</td>
                                        <td className="py-3 text-center font-bold text-white">
                                            R$ {((parseFloat(item.laborCost || 0) + parseFloat(item.materialCost || 0)) * item.quantity).toFixed(2)}
                                        </td>
                                        <td className="py-3 text-right">
                                            <button
                                                onClick={() => handleRemoveItem(index)}
                                                className="text-red-500 hover:text-red-400 hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                                            >
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Total */}
                <div className="bg-black/40 p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                    <span className="text-gray-400 font-medium text-sm">Valor Total Estimado</span>
                    <span className="text-2xl font-bold text-premium-red">
                        R$ {calculateTotal()}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row gap-3 pt-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full md:flex-1 bg-gradient-to-r from-premium-red to-red-800 hover:from-red-600 hover:to-red-900 text-white py-3 md:py-4 rounded-xl font-bold text-base md:text-lg shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />} Salvar Orçamento
                    </button>

                    <div className="flex gap-3 w-full md:flex-1">
                        <button
                            onClick={handleGeneratePDF}
                            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 md:py-4 rounded-xl font-bold text-base md:text-lg border border-gray-700 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <Printer size={20} /> PDF
                        </button>

                        <button
                            onClick={handleSendWhatsApp}
                            className="flex-1 bg-[#25D366] hover:bg-[#1ebc59] text-white py-3 md:py-4 rounded-xl font-bold text-base md:text-lg shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <Smartphone size={20} /> WhatsApp
                        </button>
                    </div>
                </div>

                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-green-900/30 border border-green-800 text-green-300 rounded-lg text-center font-medium"
                    >
                        {successMessage}
                    </motion.div>
                )}

            </div>
        </motion.div>
    );
};

export default CreateQuote;
