import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateQuotePDF = (data, logoBase64) => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(26, 26, 26); // Premium Dark Gray
    doc.rect(0, 0, 210, 40, 'F');

    // Red accent line at bottom of header
    doc.setDrawColor(217, 4, 41);
    doc.setLineWidth(1);
    doc.line(0, 40, 210, 40);

    // Logo
    if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 10, 5, 50, 30);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    const align = logoBase64 ? 'left' : 'center';
    doc.text('ORÇAMENTO', 190, 25, { align: 'right' }); // Always right aligned title for consistency

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
    doc.text(`${data.clientName}`, 20, 68);

    doc.setFont('helvetica', 'bold');
    doc.text('Contato:', 110, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.clientPhone}`, 110, 68);

    doc.text(`Data: ${data.date || new Date().toLocaleDateString('pt-BR')}`, 150, 25, { align: 'right', baseline: 'top', className: 'text-white' });

    // Prepare table body
    let tableBody = [];
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        tableBody = data.items.map(item => [
            item.description,
            item.quantity,
            `R$ ${parseFloat(item.laborCost || 0).toFixed(2)}`,
            `R$ ${parseFloat(item.materialCost || 0).toFixed(2)}`,
            `R$ ${((parseFloat(item.laborCost || 0) + parseFloat(item.materialCost || 0)) * item.quantity).toFixed(2)}`
        ]);
    } else {
        // Backward compatibility
        const labor = parseFloat(data.laborCost || 0).toFixed(2);
        const material = parseFloat(data.materialCost || 0).toFixed(2);
        const total = typeof data.total === 'string' ? data.total : data.total?.toFixed(2);
        tableBody = [[
            data.serviceDescription,
            data.quantity,
            `R$ ${labor}`,
            `R$ ${material}`,
            `R$ ${total}`
        ]];
    }

    // Table
    autoTable(doc, {
        startY: 85,
        head: [['Descrição do Serviço', 'Qtd', 'Mão de Obra (R$)', 'Material (R$)', 'Total (R$)']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [26, 26, 26], halign: 'center' },
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
    doc.text(`R$ ${totalValue}`, 190, finalY + 23, { align: 'right' });

    // Signature lines
    doc.setDrawColor(0, 0, 0);
    doc.line(20, finalY + 60, 90, finalY + 60);
    doc.line(120, finalY + 60, 190, finalY + 60);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Assinatura do Responsável', 55, finalY + 65, { align: 'center' });
    doc.text('Assinatura do Cliente', 155, finalY + 65, { align: 'center' });

    // Branding Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Serralheria Fazzer - Qualidade e Confiança', 105, 290, { align: 'center' });

    return doc;
};
