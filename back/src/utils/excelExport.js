import ExcelJS from 'exceljs';

/**
 * Exporta los datos proporcionados a un archivo Excel.
 *
 * @param {Array} result - Array de objetos que contienen los datos a exportar.
 * @param {Object} res - Objeto de respuesta HTTP para enviar el archivo.
 * @param {string} [filename='data_export'] - Nombre del archivo a descargar (sin extensión).
 */
export const exportToExcel = (result, res, filename = 'data_export') => {
    try {
        // Crear un nuevo libro de trabajo
        const workbook = new ExcelJS.Workbook();

        // Añadir una hoja al libro
        const worksheet = workbook.addWorksheet('Sheet1');

        // Definir las cabeceras (headers) a partir de las claves del primer objeto en el resultado
        const headers = Object.keys(result[0]);
        worksheet.columns = headers.map(header => ({ header, key: header, width: 20 }));

        // Añadir los datos de cada fila
        result.forEach(item => {
            worksheet.addRow(item);
        });

        // Establecer las cabeceras de la respuesta HTTP para forzar la descarga del archivo
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Enviar el archivo generado como buffer
        workbook.xlsx.write(res).then(() => {
            res.end();
        });
        
    } catch (error) {
        console.error('Error exporting to Excel: ', error);
        res.status(500).json({
            message: 'Error generando el archivo Excel',
            error: error.message,
        });
    }
};
