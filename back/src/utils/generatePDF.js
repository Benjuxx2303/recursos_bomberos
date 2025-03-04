import puppeteer from 'puppeteer';

/**
 * Genera un PDF a partir de un arreglo de objetos.
 * @param {Object[]} data - Arreglo de objetos que se convertirán en una tabla.
 * @returns {Promise<Buffer>} - Buffer del PDF generado.
 */
export const generatePDF = async (data) => {
    const htmlTemplate = templatePDF(tablePDF(data));

    // Inicia Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Establece el contenido HTML
    await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });

    // Genera el PDF
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
    });

    await browser.close();
    return pdfBuffer;
};

/**
 * Crea un template HTML para el PDF.
 * @param {string} table - HTML de la tabla.
 * @returns {string} - Template HTML.
 */
const templatePDF = (table) => {
    const css_style = `
        body { font-family: Arial, sans-serif; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid black; padding: 5px; text-align: left; font-size: 7px; }
    `
    return `
        <html>
        <head>
            <style>
            ${css_style}
            </style>
        </head>
        <body>
            <table>
                ${table}
            </table>
        </body>
        </html>
    `;
};

/**
 * Crea una tabla HTML a partir de un arreglo de objetos.
 * @param {Object[]} data - Arreglo de objetos que se convertirán en una tabla.
 * @returns {string} - HTML de la tabla.
 */
const tablePDF = (data) => {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row => {
        return `<tr>${headers.map(header => {
            const value = row[header] ?? 'n/a'; // Reemplaza null, vacío o undefined con "n/a"
            return `<td>${String(value)}</td>`; // Asegura que el valor sea un string
        }).join('')}</tr>`;
    });

    return `<thead><tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody>`;
};