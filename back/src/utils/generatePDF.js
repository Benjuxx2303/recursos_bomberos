import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

/**
 * Genera un PDF con los datos en formato de tabla.
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

        // Verifica si hay datos
        if (!data || !data.length) {
            doc.text('No hay datos disponibles.', { align: 'center' });
            doc.end();
            return;
        }

        // Configuración de la tabla
        const columns = Object.keys(data[0]);
        const margin = 50;
        const pageWidth = doc.page.width;
        const tableWidth = pageWidth - 2 * margin; // Restar los márgenes
        const totalColumns = columns.length;

        // Asignación proporcional del ancho de cada columna
        const columnWidths = columns.map(() => tableWidth / totalColumns);

        const tableTop = 100;
        const cellHeight = 16;  // Reducir aún más la altura de la celda para ajustarse mejor al texto
        const fontSize = 7;  // Reducir aún más el tamaño de la fuente

        // Función para dibujar una línea horizontal
        const drawLine = (y) => {
            doc.moveTo(margin, y).lineTo(margin + tableWidth, y).stroke();
        };

        // Función para dibujar una línea vertical
        const drawVerticalLine = (x) => {
            doc.moveTo(x, tableTop).lineTo(x, tableTop + (data.length + 1) * cellHeight).stroke();
        };

        // Estilo de la tabla
        doc.fontSize(fontSize);

        // Encabezado de la tabla
        doc.font('Helvetica-Bold');
        let x = margin;
        columns.forEach((col, index) => {
            doc.text(col, x, tableTop, { width: columnWidths[index], align: 'left', continued: index < columns.length - 1 });
            x += columnWidths[index];
            drawVerticalLine(x); // Dibuja una línea vertical para separar las columnas
        });
        doc.moveDown(1); // Espacio entre el encabezado y las filas

        // Dibuja una línea debajo del encabezado
        drawLine(tableTop + cellHeight);

        // Filas de la tabla
        doc.font('Helvetica');
        let y = tableTop + cellHeight + 2; // Empieza debajo de la línea

        data.forEach((row, rowIndex) => {
            x = margin;
            columns.forEach((col, index) => {
                const value = row[col] ?? 'N/A'; // Manejo de valores nulos o vacíos
                doc.text(value, x, y, {
                    width: columnWidths[index], 
                    align: 'left', 
                    lineBreak: true,   // Permite que el texto se ajuste a la celda
                    continued: index < columns.length - 1
                });
                x += columnWidths[index];
                drawVerticalLine(x); // Dibuja una línea vertical para separar las columnas
            });

            // Si la fila está por debajo del límite de la página, inicia una nueva página
            if (y + cellHeight > doc.page.height - margin) {
                doc.addPage();
                y = tableTop;
            } else {
                y += cellHeight;
            }
        });

        // Dibuja una línea final después de las filas
        drawLine(y);

        // Finaliza el documento
        doc.end();
    });
};