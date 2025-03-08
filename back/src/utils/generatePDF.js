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
 * Crea un template HTML para el PDF con formato clásico de informe.
 * @param {string} table - HTML de la tabla.
 * @returns {string} - Template HTML.
 */
const templatePDF = (table) => {
    const css_style = `
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 80%;
            margin: auto;
            overflow: hidden;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
        }
        .header img {
            width: 150px;
        }
        .header h2, .header h3 {
            margin: 0;
            text-align: right;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
        }
        th {
            background-color: #003366;
            color: white;
            text-align: left;
        }
        .signature {
            margin-top: 20px;
            text-align: left;
        }
        .footer {
            position: fixed;
            bottom: 20px; /* Ajusta el margen inferior del footer */
            left: 0;
            width: 100%;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            padding: 0 20px; /* Espaciado adicional a los lados */
        }
        .footer .left, .footer .right {
            display: inline-block;
        }
        .footer .left {
            text-align: left;
        }
        .footer .right {
            text-align: right;
        }
    `;

    const currentDate = new Date().toLocaleDateString('es-CL'); // Fecha en formato chileno (ej. 05/03/2025)

    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Solicitud Orden de Trabajo</title>
            <style>
                ${css_style}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://files.catbox.moe/jif8ih.png" alt="Logo CBO">
                    <div>
                        <h2>SOLICITUD ORDEN DE TRABAJO</h2>
                        <h3>CUERPO DE BOMBEROS DE OSORNO</h3>
                    </div>
                </div>
                <table>
                    ${table}
                </table>
                <div class="signature">
                    <p>Atte.</p>
                    <p>MARIO IGLESIAS GÓMEZ</p>
                    <p>TERCER COMANDANTE - CBO</p>
                </div>
            </div>
            <div class="footer">
                <div class="left">
                    <p>Unidad de Análisis y Planificación de Procesos Telecom CBO</p>
                    <p>Departamento Material Mayor CBO</p>
                    <p>Documento generado el ${currentDate}</p>
                </div>
            </div>
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
    const rows = headers.map(header => {
        return `<tr><th>${header}</th><td>${data[0][header] ?? 'n/a'}</td></tr>`;
    });

    return `<tbody>${rows.join('')}</tbody>`;
};