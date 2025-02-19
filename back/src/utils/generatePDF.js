import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

// TODO: Hacer una plantilla para el PDF

/**
 * Genera un PDF en memoria a partir de un JSON con datos.
 * 
 * @param {Array} data - Array de objetos que contiene los datos a incluir en el PDF.
 * @returns {Promise<Buffer>} - Buffer del PDF generado.
 */
export const generatePDF = async (data) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const stream = new PassThrough();
        const buffers = [];

        // Captura los datos del PDF en un buffer
        stream.on('data', buffers.push.bind(buffers));
        stream.on('end', () => resolve(Buffer.concat(buffers)));

        // Pipe del documento al stream
        doc.pipe(stream);

        // Configuración de la tabla
        const columns = Object.keys(data[0] || {});
        const columnWidths = Array(columns.length).fill(100); // Ancho fijo para cada columna

        // Encabezado de la tabla
        columns.forEach((col, index) => {
            doc.text(col, { width: columnWidths[index], continued: index < columns.length - 1 });
        });
        doc.moveDown();

        // Filas de la tabla
        data.forEach(row => {
            columns.forEach((col, index) => {
                const value = row[col] !== null && row[col] !== undefined ? row[col] : 'N/A'; // Manejo de valores nulos
                doc.text(value, { width: columnWidths[index], continued: index < columns.length - 1 });
            });
            doc.moveDown();
        });

        // Finaliza el documento
        doc.end();
    });
};