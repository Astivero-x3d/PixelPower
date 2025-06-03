import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Genera un ticket de compra en PDF con los datos del pedido, cliente y productos comprados.
 * @param {Object} pedido - Información del pedido (ID, Fecha, Total)
 * @param {Object} cliente - Información del cliente (nombre, apellidos, correo, ciudad)
 * @param {Array} detalles - Lista de productos comprados (Nombre, Precio, Cantidad)
 * @param {string} outputPath - Ruta donde se guardará el PDF generado
 */

export const generatePDF = async (pedido, cliente, detalles, outputPath) => {

    // Asegurmos que el directorio de salida exista
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Crea un nuevo documento PDF con tamaño A4 y márgenes
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Salida del PDF a archivo
    doc.pipe(fs.createWriteStream(outputPath));

    // Colores personalizados para el diseño
    const fondoOscuro = '#1e1e1e';
    const textoClaro = '#ffffff';
    const azulCyan = '#00e0ff';
    const grisSuave = '#2e2e2e';

    // Aplicamos fondo oscuro a toda la página
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(fondoOscuro);
    doc.fillColor(textoClaro); // Color por defecto para el texto

    // Insertamos el logo si está disponible
    try {
        const logoPath = path.resolve('public/img/LogoPixelPower.png');
        doc.image(logoPath, 50, 20, { width: 100 }); // Logo en la esquina superior izquierda
    } catch (err) {
        console.log('Logo no encontrado, continuando sin él...');
    }

    // Título principal del ticket
    doc
        .fontSize(22)
        .fillColor(azulCyan)
        .text('PixelPower - Ticket de Compra', 50, 55, { align: 'right' });

    // Línea decorativa bajo el título
    doc
        .moveTo(50, 95)
        .lineTo(doc.page.width - 50, 95)
        .strokeColor(azulCyan)
        .lineWidth(1)
        .stroke();

    // Datos del cliente (en un recuadro)
    doc
        .fillColor(textoClaro)
        .rect(50, 110, doc.page.width - 100, 100)
        .fill(grisSuave);

    // Recuadro con los datos del cliente
    doc
        .fillColor(azulCyan)
        .fontSize(16)
        .text('Datos del Cliente', 60, 120);

    doc
        .fillColor(textoClaro)
        .fontSize(12)
        .text(`Nombre: ${cliente.nombre_de_persona} ${cliente.apellidos}`, 60, 145)
        .text(`Email: ${cliente.correo}`, 60, 165)
        .text(`Ciudad: ${cliente.ciudad || 'No especificada'}`, 60, 185);

    // Recuadro con detalles del pedido (fecha e ID)
    const yOffset = 230;
    doc
        .fillColor(textoClaro)
        .rect(50, yOffset, doc.page.width - 100, 80)
        .fill(grisSuave);

    doc
        .fillColor(azulCyan)
        .fontSize(16)
        .text('Detalles del Pedido', 60, yOffset + 10);

    doc
        .fillColor(textoClaro)
        .fontSize(12)
        .text(`Fecha: ${new Date(pedido.Fecha).toLocaleDateString()}`, 60, yOffset + 35)
        .text(`Nº Pedido: #${pedido.ID}`, 300, yOffset + 35);

    // Lista de productos comprados
    let y = yOffset + 100;
    doc
        .fillColor(azulCyan)
        .fontSize(16)
        .text('Productos:', 60, y);

    y += 25;
    detalles.forEach(detalle => {
        doc
            .fillColor(textoClaro)
            .fontSize(12)
            .text(`• ${detalle.Nombre}`, 60, y)
            .text(`Precio: $${detalle.Precio}`, 250, y)
            .text(`Cantidad: ${detalle.Cantidad || 1}`, 400, y);
        y += 20; // Espaciado entre productos
    });

    // Total a pagar, resaltado en color verde
    y += 10;
    doc
        .fontSize(16)
        .fillColor('#00ff88')
        .text(`Total a pagar: $${pedido.Total}`, 60, y, {
            align: 'right'
        });

    // Footer del ticket con agradecimiento y derechos
    doc
        .fontSize(10)
        .fillColor('#888')
        .text('¡Gracias por tu compra en PixelPower!', 50, doc.page.height - 70, {
            align: 'center'
        })
        .text('© 2025 PixelPower. Todos los derechos reservados.', 50, doc.page.height - 50, {
            align: 'center'
        });

    // Finaliza y guarda el documento
    doc.end();
};
