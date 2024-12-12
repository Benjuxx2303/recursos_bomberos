import { parse, isValid, isBefore } from 'date-fns';

/**
 * Validates a Chilean RUT (Rol Único Tributario).
 *
 * This function removes any dots and hyphens from the input RUT, verifies the format,
 * extracts the body and the check digit, and calculates the check digit using the standard algorithm.
 * It then compares the calculated check digit with the provided one to determine if the RUT is valid.
 *
 * @param {string} rut - The RUT to be validated. It can contain dots and hyphens.
 * @returns {boolean} - Returns `true` if the RUT is valid, otherwise `false`.
 */
export function validateRUT(rut) {
  // Eliminar los puntos y el guion
  const cleanRUT = rut.replace(/[.\-]/g, "");

  // Verificar que el formato sea correcto (Debe ser un número seguido de un dígito verificador)
  const rutPattern = /^\d{7,8}[0-9K]$/i;
  if (!rutPattern.test(cleanRUT)) {
    return false;
  }

  // Extraer el cuerpo y el dígito verificador
  const cuerpo = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1).toUpperCase();

  // Calcular el dígito verificador usando el algoritmo estándar
  let suma = 0;
  let multiplo = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i)) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  const resto = suma % 11;
  const calculoDV =
    resto === 1 ? "K" : resto === 0 ? "0" : (11 - resto).toString();

  // Comprobar si el dígito verificador coincide con el calculado
  return dv === calculoDV;
}


/**
 * Validates if the given value is a valid float number.
 *
 * @param {string|number} value - The value to be validated.
 * @returns {string|null} - Returns an error message if the value is not a valid float or is negative, otherwise returns null.
 */
export function validateFloat(value) {
  const floatValue = parseFloat(value);
  
  if (isNaN(floatValue)) {
      return "El valor debe ser un número válido.";
  }
  
  if (floatValue < 0) {
      return "El valor no puede ser negativo.";
  }
  
  return null;
}


/**
 * Validates the structure of an email address.
 *
 * @param {string} email - The email address to validate.
 * @returns {boolean} - Returns true if the email address is valid, otherwise false.
 */
export function validateEmail(email) {
  // Expresión regular para validar la estructura del correo electrónico
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Comprobación si el email cumple con la expresión regular
  return regex.test(email);
}

// Expresiones regulares para validar fecha y hora
const fechaRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
const horaRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

/**
 * Validates a date and optionally a time.
 *
 * @param {string} fecha - The date string to validate.
 * @param {string} [hora=''] - The optional time string to validate.
 * @returns {boolean} - Returns true if the date (and optionally the time) is valid, otherwise false.
 */
export function validateDate(fecha, hora = '') {
  // Validación de la fecha
  if (!fechaRegex.test(fecha)) {
    return false; // La fecha no es válida
  }

  // Si se proporciona una hora, validamos también
  if (hora && !horaRegex.test(hora)) {
    return false; // La hora no es válida
  }

  // Si no hay errores de validación, retornamos true
  return true;
}


/**
 * Validates if a value matches a specified type.
 *
 * @param {*} value - The value to be validated.
 * @param {string} type - The type to validate against. Can be "array", "null", or any valid JavaScript type.
 * @returns {boolean} - Returns true if the value matches the specified type, otherwise false.
 */
export function validateType(value, type) {
  if (type === "array") {
    return Array.isArray(value);
  }

  if (type === "null") {
    return value === null;
  }

  return typeof value === type;
}

/**
 * Validates that the start date is before the end date.
 * The dates can be provided as strings in the formats 'dd-MM-yyyy' or 'dd-MM-yyyy HH:mm'.
 *
 * @param {string|Date} startDate - The start date to validate.
 * @param {string|Date} endDate - The end date to validate.
 * @returns {boolean} - Returns true if the end date is not before the start date, otherwise false.
 * @throws {Error} - Throws an error if the provided dates are not valid.
 */
export function validateStartEndDate(startDate, endDate) {
  // Definir los formatos esperados
  const dateFormat = 'dd-MM-yyyy';          // Formato sin hora
  const dateTimeFormat = 'dd-MM-yyyy HH:mm'; // Formato con hora

  // Función para parsear las fechas, manejando ambos formatos
  const parseDate = (dateString) => {
    // Primero intentamos con el formato completo con hora
    let parsedDate = parse(dateString, dateTimeFormat, new Date());
    
    // Si no es válido, intentamos con solo la fecha (sin hora)
    if (!isValid(parsedDate)) {
      parsedDate = parse(dateString, dateFormat, new Date());
    }

    return parsedDate;
  };

  // Parsear las fechas si son cadenas
  if (typeof startDate === 'string') {
    startDate = parseDate(startDate);
  }
  if (typeof endDate === 'string') {
    endDate = parseDate(endDate);
  }

  // Validar que las fechas sean correctas
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
    throw new Error("Las fechas proporcionadas no son válidas.");
  }

  // Validar si las fechas son válidas
  if (!isValid(startDate)) {
    throw new Error("La fecha de inicio proporcionada no es válida.");
  }
  if (!isValid(endDate)) {
    throw new Error("La fecha de fin proporcionada no es válida.");
  }

  // Comprobar si endDate es anterior a startDate
  return !isBefore(endDate, startDate);
}
