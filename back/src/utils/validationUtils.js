/**
 * Valida que un campo no esté vacío y que no supere una longitud máxima.
 * @param {string} field - El valor del campo a validar.
 * @param {number} maxLength - La longitud máxima permitida.
 * @param {string} fieldName - El nombre del campo (para el mensaje de error).
 * @returns {string|null} Un mensaje de error o null si es válido.
 */
export const validateField = (field, maxLength, fieldName) => {
    if (field === null || field === "") {
        return `${fieldName} no puede estar vacío`;
    }
    if (field.length > maxLength) {
        return `${fieldName} no puede tener más de ${maxLength} caracteres`;
    }
    return null;
};

