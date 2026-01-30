import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Printer, Smartphone, DollarSign, User, Phone, Hammer, RefreshCw } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { generateQuotePDF } from '../utils/pdfGenerator';

const CreateQuote = () => {
    const [formData, setFormData] = useState({
        clientName: '',
        clientPhone: '',
        serviceDescription: '',
        quantity: 1,
        laborCost: '',
        materialCost: '',
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
        const labor = parseFloat(formData.laborCost) || 0;
        const material = parseFloat(formData.materialCost) || 0;
        return (labor + material).toFixed(2);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        // Validate
        if (!formData.clientName || !formData.serviceDescription || !formData.laborCost) {
            alert('Por favor preencha os campos obrigatórios.');
            return;
        }

        setIsSaving(true);
        try {
            await addDoc(collection(db, "quotes"), {
                ...formData,
                total: calculateTotal(),
                createdAt: serverTimestamp()
            });

            setSuccessMessage('Orçamento Salvo com Sucesso!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error("Error adding document: ", error);
            alert('Erro ao salvar no banco de dados. Verifique a configuração.');
        } finally {
            setIsSaving(false);
        }
    };

    const getFormattedData = () => ({
        ...formData,
        total: calculateTotal(),
        date: new Date().toLocaleDateString('pt-BR')
    });

    const handleGeneratePDF = () => {
        const doc = generateQuotePDF(getFormattedData(), logoBase64);
        doc.save(`Orcamento_${formData.clientName.replace(/\s+/g, '_')}.pdf`);
    };

    const handleSendWhatsApp = async () => {
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
        const text = `*Olá ${formData.clientName}!*\n\nAqui está o seu orçamento da *Serralheria Fazzer*:\n\n*Serviço:* ${formData.serviceDescription}\n*Total:* R$ ${calculateTotal()}\n\n_O arquivo PDF do orçamento foi baixado no seu dispositivo para que você possa enviá-lo._`;

        // Download PDF for user to attach
        handleGeneratePDF();

        const url = `https://wa.me/${formData.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
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
                            value={formData.clientName}
                            onChange={handleInputChange}
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
                            value={formData.clientPhone}
                            onChange={handleInputChange}
                            className="w-full bg-premium-light-gray border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-premium-red transition-colors"
                            placeholder="Ex: 11999998888"
                        />
                    </div>
                </div>

                {/* Service Info */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Hammer size={16} className="text-premium-red" /> Descrição do Serviço
                    </label>
                    <textarea
                        name="serviceDescription"
                        value={formData.serviceDescription}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full bg-premium-light-gray border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-premium-red transition-colors"
                        placeholder="Ex: Confecção e instalação de portão basculante..."
                    ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Quantidade</label>
                        <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            className="w-full bg-premium-light-gray border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-premium-red transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <DollarSign size={16} className="text-premium-red" /> Valor Mão de Obra
                        </label>
                        <input
                            type="number"
                            name="laborCost"
                            value={formData.laborCost}
                            onChange={handleInputChange}
                            className="w-full bg-premium-light-gray border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-premium-red transition-colors"
                            placeholder="0.00"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <DollarSign size={16} className="text-premium-red" /> Valor Material (Opcs)
                        </label>
                        <input
                            type="number"
                            name="materialCost"
                            value={formData.materialCost}
                            onChange={handleInputChange}
                            className="w-full bg-premium-light-gray border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-premium-red transition-colors"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Total */}
                <div className="bg-black/40 p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                    <span className="text-gray-400 font-medium text-sm">Valor Total Estimado</span>
                    <span className="text-2xl font-bold text-premium-red">
                        R$ {calculateTotal()}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-4 pt-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 bg-gradient-to-r from-premium-red to-red-800 hover:from-red-600 hover:to-red-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        {isSaving ? <RefreshCw className="animate-spin" /> : <Save />} Salvar Orçamento
                    </button>

                    <button
                        onClick={handleGeneratePDF}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-4 rounded-xl font-bold text-lg border border-gray-700 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <Printer /> Gerar PDF
                    </button>

                    <button
                        onClick={handleSendWhatsApp}
                        className="flex-1 bg-[#25D366] hover:bg-[#1ebc59] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <Smartphone /> Enviar WhatsApp
                    </button>
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
