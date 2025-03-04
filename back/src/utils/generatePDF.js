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
            margin: 20px; 
        }
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        header img {
            width: 80px; /* Ajusta el tamaño de la imagen del logo */
            height: auto;
        }
        .company-info {
            text-align: right;
            font-size: 10px;
        }
        h1 {
            font-size: 18px;
            margin: 0;
        }
        h2 {
            font-size: 14px;
            margin-top: 5px;
            margin-bottom: 10px;
        }
        .content {
            margin-bottom: 20px;
        }
        .footer {
            position: fixed;
            bottom: 10px;
            left: 20px;
            font-size: 8px;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
        }
        th, td { 
            border: 1px solid black; 
            padding: 8px; 
            text-align: left; 
            font-size: 8px; 
        }
        th {
            background-color: #f2f2f2;
        }
    `;

    return `
        <html>
        <head>
            <style>
            ${css_style}
            </style>
        </head>
        <body>
            <!-- Encabezado -->
            <header>
                <!-- Logo de la empresa -->
                <img src="https://files.catbox.moe/jif8ih.png" alt="Logo de la empresa">
                
                <!-- Datos de la empresa -->
                <div class="company-info">
                    <h1>Cuerpo de bomberos de Osorno</h1>
                    <p>Dirección: Calle Ejemplo 123, Ciudad</p>
                    <p>Tel: +123 456 789</p>
                    <p>Correo: contacto@empresa.com</p>
                </div>
            </header>
            
            <!-- Cuerpo del informe -->
            <div class="content">
                <h3>Resumen de Actividades</h3>
                <p>En el siguiente informe se detallan las actividades realizadas durante el periodo correspondiente. Se incluyen las métricas relevantes y los resultados alcanzados.</p>
                <table>
                    ${table}
                </table>
            </div>
            
            <!-- Pie de página -->
            <div class="footer">
                <p>Informe generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}.</p>
                <p>Confidencial: Este informe es confidencial y está destinado solo para uso interno.</p>
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
    const rows = data.map(row => {
        return `<tr>${headers.map(header => {
            const value = row[header] ?? 'n/a'; // Reemplaza null, vacío o undefined con "n/a"
            return `<td>${String(value)}</td>`; // Asegura que el valor sea un string
        }).join('')}</tr>`;
    });

    return `<thead><tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody>`;
};