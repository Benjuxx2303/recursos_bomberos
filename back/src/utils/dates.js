// Mismas funciones desde "validations.js" pero solo con JavaScript Vanilla

/**
 * Validates a date and optionally a time.
 *
 * @param {string} fecha - The date string to validate.
 * @param {string} [hora=''] - The optional time string to validate.
 * @returns {boolean} - Returns true if the date (and optionally the time) is valid, otherwise false.
 */
export function validateDate(fecha, hora = "") {
  // Expresiones regulares para diferentes formatos de fecha
  const formatosFecha = [
    /^\d{4}-\d{2}-\d{2}$/, // ISO 8601 (yyyy-MM-dd)
    /^\d{2}\/\d{2}\/\d{4}$/, // dd/MM/yyyy o MM/dd/yyyy
    /^\d{4}\/\d{2}\/\d{2}$/, // yyyy/MM/dd
    /^\d{2}-\d{2}-\d{4}$/, // dd-MM-yyyy o MM-dd-yyyy
  ];

  let esValida = formatosFecha.some((regex) => regex.test(fecha));
  if (!esValida) return false;

  // Validamos la conversión a objeto Date
  const partes = fecha.split(/[-\/]/);
  let parsedDate;
  if (fecha.includes("-")) {
    parsedDate = new Date(partes[0], partes[1] - 1, partes[2]);
  } else {
    parsedDate = new Date(partes[2], partes[1] - 1, partes[0]);
  }

  if (isNaN(parsedDate.getTime())) return false;

  // Validación de hora opcional
  if (hora && !/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(hora)) {
    return false;
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
 */
export function validateStartEndDate(startDate, endDate) {
  // Convertir a objeto Date si es una cadena
  const parseDate = (dateInput) => {
    if (dateInput instanceof Date) return dateInput;
    const partes = dateInput.split(/[-\/]/);
    return dateInput.includes("-")
      ? new Date(partes[0], partes[1] - 1, partes[2])
      : new Date(partes[2], partes[1] - 1, partes[0]);
  };

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Una de las fechas proporcionadas no es válida.");
  }

  return end >= start;
}

/**
 * Transforms a date and optional time into the format "YYYY-MM-DD" and "HH:MM:SS".
 *
 * @param {string} fecha - The date string to transform.
 * @param {string} [hora] - The optional time string to transform.
 * @returns {string} - The formatted date and time in the format "YYYY-MM-DD" and "HH:MM:SS".
 */
export function formatDateTime(fecha, hora = "") {
    if (!fecha) {
      throw new Error("La fecha proporcionada no es válida.");
    }
  
    // Validamos que sea un string no vacío
    if (typeof fecha !== 'string' || fecha.trim() === '') {
      throw new Error("La fecha debe ser un string no vacío.");
    }
  
    const partes = fecha.split(/[-\/]/);
    let parsedDate;
  
    if (fecha.includes("-")) {
      parsedDate = new Date(partes[0], partes[1] - 1, partes[2]);
    } else {
      parsedDate = new Date(partes[2], partes[1] - 1, partes[0]);
    }
  
    if (isNaN(parsedDate.getTime())) {
      throw new Error("La fecha proporcionada no es válida.");
    }
  
    const formattedDate = parsedDate.toISOString().split("T")[0];
    let formattedTime = "00:00:00";
  
    if (hora) {
      const match = hora.match(
        /^(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/ 
      );
      if (!match) {
        throw new Error("La hora proporcionada no es válida.");
      }
      formattedTime = match[3]
        ? `${match[1]}:${match[2]}:${match[4]}`
        : `${match[1]}:${match[2]}:00`;
    }
  
    return `${formattedDate} ${formattedTime}`;
  }
  
