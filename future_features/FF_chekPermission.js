/* Protección en el backend:
Cuando el frontend hace una petición al backend (por ejemplo, crear un servicio), el backend aún debe validar los permisos desde el token JWT.
Ejemplo en el middleware checkPermission:

 */

const jwt = require('jsonwebtoken');

function checkPermission(requiredPermission) {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.permisos.includes(requiredPermission)) {
        return res.status(403).json({ error: 'Permiso insuficiente' });
      }

      next(); // Permiso válido, continuar
    } catch (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
  };
}

app.post('/api/servicios', checkPermission('crear_servicio'), (req, res) => {
  // Lógica para crear el servicio
  res.status(201).json({ message: 'Servicio creado' });
});
