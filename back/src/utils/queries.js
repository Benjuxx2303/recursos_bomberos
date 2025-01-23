/**
 * Verifica si un valor ya existe en una tabla, excluyendo un registro por su id.
 *
 * @param {Object} pool - La instancia de la conexión a la base de datos.
 * @param {string} value - El valor a verificar (por ejemplo, nombre de usuario).
 * @param {string} field - El nombre de la columna o campo a verificar (por ejemplo, "username").
 * @param {string} table - El nombre de la tabla en la que buscar (por ejemplo, "usuario").
 * @param {number} id - El id del registro a excluir en la búsqueda (por ejemplo, para actualizaciones).
 * @param {Array} errors - Un array para almacenar los errores si el valor ya existe.
 */
export async function checkIfExistsForUpdate(
  pool,
  value,
  field,
  table,
  id,
  errors
) {
  // Validar existencia del valor en la base de datos, excluyendo el registro por su id
  const [result] = await pool.query(
    `SELECT COUNT(*) AS count FROM ${table} WHERE ${field} = ? AND id != ? AND isDeleted = 0`,
    [value, id]
  );

  // Si el valor ya existe, agregar el error
  if (result[0] && result[0].count > 0) {
    errors.push(`El ${field} ya está en uso`);
  }
}

/**
 * Verifica si un valor ya existe en una tabla.
 *
 * @param {Object} pool - La instancia de la conexión a la base de datos.
 * @param {string} value - El valor a verificar (por ejemplo, nombre de usuario).
 * @param {string} field - El nombre de la columna o campo a verificar (por ejemplo, "username").
 * @param {string} table - El nombre de la tabla en la que buscar (por ejemplo, "usuario").
 * @param {Array} errors - Un array para almacenar los errores si el valor ya existe.
 */
export async function checkIfExists(pool, value, field, table, errors) {
  // Validar existencia del valor en la base de datos
  const [result] = await pool.query(
    `SELECT COUNT(*) AS count FROM ${table} WHERE ${field} = ? AND isDeleted = 0`,
    [value]
  );

  // Si el valor ya existe, agregar el error
  if (result[0] && result[0].count > 0) {
    errors.push(`El ${field} ya está en uso`);
  }
}

/**
 * Verifica si un registro existe y no está marcado como eliminado.
 *
 * @param {Object} pool - La instancia de la conexión a la base de datos.
 * @param {number} id - El ID del registro a verificar (por ejemplo, el ID del personal).
 * @param {string} table - El nombre de la tabla en la que buscar (por ejemplo, "personal").
 * @param {Array} errors - Un array para almacenar los errores si el registro no existe o está eliminado.
 */
export async function checkIfDeleted(pool, id, table, errors) {
  // Verificar si el registro existe y no está eliminado
  const [result] = await pool.query(
    `SELECT 1 FROM ${table} WHERE id = ? AND isDeleted = 0`,
    [id]
  );

  // Si no existe o está eliminado, agregar el error
  if (result.length === 0) {
    errors.push(`${table} no existe o está eliminado`);
  }
}
