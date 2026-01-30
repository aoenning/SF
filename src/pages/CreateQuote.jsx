import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Printer, Smartphone, DollarSign, User, Phone, Hammer, RefreshCw } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    const generatePDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFillColor(217, 4, 41); // Premium Red
        // Header background
        doc.rect(0, 0, 210, 40, 'F');

        // Logo
        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', 10, 5, 50, 30);
        }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        // Adjust text position based on logo existence
        const titleX = logoBase64 ? 70 : 105;
        const align = logoBase64 ? 'left' : 'center';
        doc.text('ORÇAMENTO', 190, 25, { align: 'right' });

        // Content
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);

        // Client Info Box
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(15, 50, 180, 25, 3, 3, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.text('Dados do Cliente:', 20, 60);
        doc.setFont('helvetica', 'normal');
        doc.text(`${formData.clientName}`, 20, 68);

        doc.setFont('helvetica', 'bold');
        doc.text('Contato:', 110, 60);
        doc.setFont('helvetica', 'normal');
        doc.text(`${formData.clientPhone}`, 110, 68);

        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 150, 25, { align: 'right', baseline: 'top', className: 'text-white' });

        // Table
        autoTable(doc, {
            startY: 85,
            head: [['Descrição do Serviço', 'Qtd', 'Mão de Obra (R$)', 'Material (R$)', 'Total (R$)']],
            body: [[
                formData.serviceDescription,
                formData.quantity,
                `R$ ${parseFloat(formData.laborCost || 0).toFixed(2)}`,
                `R$ ${parseFloat(formData.materialCost || 0).toFixed(2)}`,
                `R$ ${calculateTotal()}`
            ]],
            theme: 'grid',
            headStyles: { fillColor: [217, 4, 41], halign: 'center' },
            bodyStyles: { halign: 'center' },
            columnStyles: {
                0: { halign: 'left', cellWidth: 80 }
            }
        });

        // Footer
        const finalY = doc.lastAutoTable.finalY || 150;

        doc.setFillColor(240, 240, 240);
        doc.rect(120, finalY + 10, 75, 20, 'F');

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(217, 4, 41);
        doc.text(`VALOR TOTAL`, 125, finalY + 23);
        doc.setTextColor(0, 0, 0);
        doc.text(`R$ ${calculateTotal()}`, 190, finalY + 23, { align: 'right' });

        // Signature lines
        doc.setDrawColor(0, 0, 0);
        doc.line(20, finalY + 60, 90, finalY + 60);
        doc.line(120, finalY + 60, 190, finalY + 60);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Assinatura do Responsável', 55, finalY + 65, { align: 'center' });
        doc.text('Assinatura do Cliente', 155, finalY + 65, { align: 'center' });

        doc.save(`Orcamento_${formData.clientName.replace(/\s+/g, '_')}.pdf`);
    };

    const sendToWhatsApp = () => {
        const text = `*Olá ${formData.clientName}!*\n\nAqui está o seu orçamento da *Serralheria Fazzer*:\n\n*Serviço:* ${formData.serviceDescription}\n*Total:* R$ ${calculateTotal()}\n\nFico no aguardo!`;
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
                <div className="bg-black/40 p-6 rounded-xl border border-gray-800 flex justify-between items-center">
                    <span className="text-gray-400 font-medium">Valor Total Estimado</span>
                    <span className="text-4xl font-bold text-premium-red">
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
                        onClick={generatePDF}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-4 rounded-xl font-bold text-lg border border-gray-700 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <Printer /> Gerar PDF
                    </button>

                    <button
                        onClick={sendToWhatsApp}
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
