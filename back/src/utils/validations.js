import { format, isBefore, isValid, parse, parseISO } from 'date-fns';

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
// TODO: Formatear rut con puntos
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

/**
 * Validates a username based on specific criteria and adds error messages to the errors array.
 *
 * @param {string} username - The username to validate.
 * @param {string[]} errors - An array to store error messages if the username does not meet the criteria.
 */
export function validateUsername(username, errors) {
  // Verificar que no esté vacío
  if (!username || username.trim().length === 0) {
    errors.push('El nombre de usuario no puede estar vacío.');
    return; // Si está vacío, no hace falta continuar con el resto de las validaciones
  }

  // Verificar longitud
  if (username.length < 4 || username.length > 20) {
    errors.push('El nombre de usuario debe tener entre 4 y 20 caracteres.');
  }

  // Verificar caracteres permitidos (letras, números y guion bajo)
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('El nombre de usuario solo puede contener letras, números y guiones bajos.');
  }

  // Verificar que no empiece ni termine con un guion bajo
  if (username.startsWith('_') || username.endsWith('_')) {
    errors.push('El nombre de usuario no puede empezar ni terminar con un guion bajo.');
  }

  // Verificar que no contenga espacios
  if (/\s/.test(username)) {
    errors.push('El nombre de usuario no puede contener espacios.');
  }
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
 * Validates a password based on specific criteria and adds error messages to the errors array.
 *
 * @param {string} password - The password to validate.
 * @param {string[]} errors - An array to store error messages if the password does not meet the criteria.
 */
export function validatePassword(password, errors) {
  // Verificar que no esté vacía
  if (!password || password.trim().length === 0) {
    errors.push('La contraseña no puede estar vacía.');
    return; // Si está vacía, no hace falta continuar con el resto de las validaciones
  }

  // Verificar longitud
  if (password.length < 8 || password.length > 16) {
    errors.push('La contraseña debe tener entre 8 y 16 caracteres.');
  }
/* 
  // Verificar mayúsculas
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe incluir al menos una letra mayúscula.');
  }

  // Verificar minúsculas
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe incluir al menos una letra minúscula.');
  } */

  // Verificar números
  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe incluir al menos un número.');
  }
}

/**
 * Validates a date and optionally a time.
 *
 * @param {string} fecha - The date string to validate.
 * @param {string} [hora=''] - The optional time string to validate.
 * @returns {boolean} - Returns true if the date (and optionally the time) is valid, otherwise false.
 */
export function validateDate(fecha, hora = '') {
  // Definir varios formatos posibles de fecha
  const formatosFecha = [
    'yyyy-MM-dd',  // ISO 8601 (yyyy-MM-dd)
    'dd/MM/yyyy',  // dd/MM/yyyy
    'MM/dd/yyyy',  // MM/dd/yyyy
    'yyyy/MM/dd',  // yyyy/MM/dd
    'dd-MM-yyyy',  // dd-MM-yyyy
    'MM-dd-yyyy'   // MM-dd-yyyy
  ];

  // Intentamos parsear la fecha con varios formatos
  let parsedDate = null;
  for (const formato of formatosFecha) {
    parsedDate = parse(fecha, formato, new Date());
    if (isValid(parsedDate)) {
      break;
    }
  }

  // Si no encontramos un formato válido, retornamos false
  if (!isValid(parsedDate)) {
    return false;
  }

  // Si se proporciona una hora, validamos también
  if (hora && !/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(hora)) {
    return false; // La hora no es válida
  }

  return true;
}

/**
 * Validates that the start date is before the end date.
 * The dates can be provided as strings in various formats or as Date objects.
 *
 * @param {string|Date} startDate - The start date to validate.
 * @param {string|Date} endDate - The end date to validate.
 * @returns {boolean} - Returns true if the end date is not before the start date, otherwise false.
 * @throws {Error} - Throws an error if the provided dates are not valid.
 */
export function validateStartEndDate(startDate, endDate) {
  // Función para parsear las fechas de manera más flexible
  const parseDate = (dateInput) => {
    // Si ya es un objeto Date, lo retornamos directamente
    if (dateInput instanceof Date) return dateInput;

    // Intentar convertir la cadena a una fecha válida
    const parsedDate = parseISO(dateInput);
    
    // Verificar si la fecha es válida
    if (!isValid(parsedDate)) {
      throw new Error("La fecha proporcionada no es válida.");
    }
    return parsedDate;
  };

  // Parsear las fechas si son cadenas
  startDate = parseDate(startDate);
  endDate = parseDate(endDate);

  // Comprobar si endDate es anterior a startDate
  return !isBefore(endDate, startDate);
}

/**
 * Transforms a date and optional time into the format "YYYY-MM-DD" and "HH:MM:SS".
 * 
 * @param {string} fecha - The date string to transform.
 * @param {string} [hora] - The optional time string to transform.
 * @returns {string} - The formatted date and time in the format "YYYY-MM-DD" and "HH:MM:SS".
 */
export function formatDateTime(fecha, hora = '') {
  // Intentamos parsear la fecha en varios formatos posibles
  const formatosFecha = [
    'yyyy-MM-dd',  // ISO 8601 (yyyy-MM-dd)
    'dd/MM/yyyy',  // dd/MM/yyyy
    'MM/dd/yyyy',  // MM/dd/yyyy
    'yyyy/MM/dd',  // yyyy/MM/dd
    'dd-MM-yyyy',  // dd-MM-yyyy
    'MM-dd-yyyy'   // MM-dd-yyyy
  ];

  let parsedDate = null;

  // Intentamos parsear la fecha con varios formatos
  for (const formato of formatosFecha) {
    parsedDate = parse(fecha, formato, new Date());
    if (isValid(parsedDate)) {
      break;
    }
  }

  // Si la fecha no es válida, lanzamos un error
  if (!isValid(parsedDate)) {
    throw new Error("La fecha proporcionada no es válida.");
  }

  // Si se proporciona una hora, la validamos
  let formattedTime = '';
  if (hora) {
    // Validar que la hora tenga el formato "HH:MM" o "HH:MM:SS"
    const horaRegex = /^(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/;
    const match = hora.match(horaRegex);
    
    if (!match) {
      throw new Error("La hora proporcionada no es válida.");
    }

    // Si la hora es "HH:MM", añadimos los segundos ":00"
    if (!match[3]) {
      formattedTime = `${match[1]}:${match[2]}:00`;
    } else {
      formattedTime = `${match[1]}:${match[2]}:${match[4]}`;
    }
  }

  // Si no se proporciona hora, solo retornamos la fecha
  const formattedDate = format(parsedDate, 'yyyy-MM-dd');
  
  if (formattedTime) {
    return `${formattedDate} ${formattedTime}`;
  } else {
    return formattedDate;
  }
}