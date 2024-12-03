/* Durante el inicio de sesión:
El backend consulta los permisos del usuario desde la base de datos y los incluye en el token JWT o en la sesión.
 */
const jwt = require('jsonwebtoken');

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  // Validar usuario
  const user = await pool.query('SELECT * FROM usuario WHERE username = ?', [username]);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  // Consultar permisos del usuario
  const permisos = await pool.query(
    'SELECT p.codigo FROM permisos p JOIN rol_permisos rp ON p.id = rp.permisos_id WHERE rp.rol_personal_id = ?',
    [user.rol_personal_id]
  );

  // Crear token JWT con permisos
  const token = jwt.sign(
    { id: user.id, permisos: permisos.map(p => p.codigo) },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token });
});




/* El token JWT incluye los permisos del usuario como un array (por ejemplo: ["crear_servicio", "ver_reportes"]). */

/* Estructura de permisos:
Usuarios asignados a Grupos: Esto es útil para aplicar permisos en bloque, lo que simplifica la gestión de accesos para grupos grandes de usuarios.
Roles con permisos: Esto permite asignar permisos específicos a roles y luego aplicar esos roles a los usuarios.
Grupos con permisos (grupo_permisos): Esto permite a los grupos tener permisos propios, independientemente de los roles de los usuarios.
Usuarios con roles: Esto facilita asignar permisos a nivel individual mediante roles. */