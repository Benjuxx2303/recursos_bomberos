import puppeteer from 'puppeteer';

/**
 * Genera un PDF a partir de un arreglo de objetos.
 * @param {Object[]} data - Arreglo de objetos que se convertirán en una tabla.
 * @param {string} [title="ORDEN DE TRABAJO"] - Título del informe.
 * @returns {Promise<Buffer>} - Buffer del PDF generado.
 */
export const generatePDF = async (data, title = "ORDEN DE TRABAJO") => {
    const htmlTemplate = templatePDF(tablePDF(data), title);  // Se pasa el title a templatePDF

    // Inicia Puppeteer con los parámetros adecuados
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Evita el error de ejecución como root
    });
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
 * @param {string} [title="Orden de Trabajo"] - Título del informe.
 * @returns {string} - Template HTML.
 */
const templatePDF = (table, title = "ORDEN DE TRABAJO") => {
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
            bottom: 20px;
            left: 0;
            width: 100%;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            padding: 0 20px;
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
            <title>${title}</title>
            <style>
                ${css_style}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://flotacbo-s3.s3.us-east-2.amazonaws.com/logocbo.png" alt="Logo CBO">
                    <div>
                        <h2>${title}</h2>
                        <h3>CUERPO DE BOMBEROS DE OSORNO</h3>
                    </div>
                </div>
                <table>
                    ${table}
                </table>
                <div class="signature">
                    <p>Atte.</p>
                    <p>RODRIGO IGNACIO JARA</p>
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