/**
 * Convierte una fecha entre diferentes formatos
 * @param {string} dateString - La fecha a convertir
 * @param {string} fromFormat - El formato de entrada ('dd-MM-yyyy' o 'yyyy-MM-dd')
 * @param {string} toFormat - El formato de salida ('dd-MM-yyyy' o 'yyyy-MM-dd')
 * @returns {string} - La fecha convertida en el formato deseado
 */
export const convertDateFormat = (dateString, fromFormat = 'dd-MM-yyyy', toFormat = 'yyyy-MM-dd') => {
    if (!dateString) return null;

    // Si la fecha ya está en el formato deseado, la devolvemos sin cambios
    if (fromFormat === toFormat) {
        // Validar que la fecha tenga el formato correcto antes de devolverla
        let isValid = false;
        
        if (fromFormat === 'dd-MM-yyyy' && /^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
            isValid = true;
        } else if (fromFormat === 'yyyy-MM-dd' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            isValid = true;
        }
        
        if (isValid) {
            return dateString;
        }
    }

    try {
        let day, month, year;

        if (fromFormat === 'dd-MM-yyyy') {
            [day, month, year] = dateString.split('-');
        } else {
            [year, month, day] = dateString.split('-');
        }

        // Validar que los componentes de la fecha sean válidos
        if (!day || !month || !year) {
            throw new Error('Formato de fecha inválido');
        }

        // Asegurarse de que los valores sean números
        day = parseInt(day, 10);
        month = parseInt(month, 10);
        year = parseInt(year, 10);

        // Validar que los valores estén en rangos válidos
        if (
            isNaN(day) || isNaN(month) || isNaN(year) ||
            day < 1 || day > 31 ||
            month < 1 || month > 12 ||
            year < 1900 || year > 2100
        ) {
            throw new Error('Valores de fecha inválidos');
        }

        // Formatear los componentes con ceros a la izquierda si es necesario
        const formattedDay = day.toString().padStart(2, '0');
        const formattedMonth = month.toString().padStart(2, '0');
        const formattedYear = year.toString();

        // Retornar en el formato solicitado
        return toFormat === 'dd-MM-yyyy'
            ? `${formattedDay}-${formattedMonth}-${formattedYear}`
            : `${formattedYear}-${formattedMonth}-${formattedDay}`;
    } catch (error) {
        console.error('Error al convertir fecha:', error);
        return null;
    }
};

/**
 * Valida si una fecha está en formato válido (dd-MM-yyyy o yyyy-MM-dd)
 * @param {string} dateString - La fecha a validar
 * @returns {boolean} - true si la fecha es válida, false si no lo es
 */
export const isValidDate = (dateString) => {
    if (!dateString) return false;

    const formats = [
        /^\d{2}-\d{2}-\d{4}$/, // dd-MM-yyyy
        /^\d{4}-\d{2}-\d{2}$/, // yyyy-MM-dd
    ];

    // Verificar si la fecha coincide con alguno de los formatos
    const isValidFormat = formats.some(format => format.test(dateString));
    if (!isValidFormat) return false;

    try {
        // Intentar convertir la fecha para validar los valores
        const result = convertDateFormat(dateString);
        return result !== null;
    } catch {
        return false;
    }
}; 