import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { HOST, SALT_ROUNDS, SECRET_JWT_KEY } from "../config.js";
import { pool } from "../db.js";
import { sendEmail } from './mailer.js';

// Obtener todos los usuarios
export const getUsuarios = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM usuario WHERE isDeleted = 0");
        res.json(rows);
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Obtener usuarios con detalles
export const getUsuariosWithDetails = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                u.username, 
                u.correo,
                p.nombre AS 'Nombre',
                p.apellido AS 'Apellido'
            FROM usuario u
            INNER JOIN personal p ON u.personal_id = p.id
            WHERE u.isDeleted = 0
        `);
        res.json(rows);
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Obtener usuarios con detalles y paginación
export const getUsuariosWithDetailsPage = async (req, res) => {
    try {
        // Obtener los parámetros opcionales de la consulta (query)
        const page = parseInt(req.query.page) || 1; // Si no se proporciona, se asume la página 1
        const pageSize = parseInt(req.query.pageSize) || 10; // Si no se proporciona, se asume un tamaño de página de 10

        // Si no se proporciona "page", devolver todos los registros sin paginación
        if (!req.query.page) {
            const query = `
                SELECT 
                    u.id,
                    u.username, 
                    u.correo,
                    p.nombre AS 'Nombre',
                    p.apellido AS 'Apellido'
                FROM usuario u
                INNER JOIN personal p ON u.personal_id = p.id
                WHERE u.isDeleted = 0
            `;
            const [rows] = await pool.query(query);
            return res.json(rows); // Devuelve todos los registros sin paginación
        }

        // Si se proporciona "page", aplicar paginación
        const offset = (page - 1) * pageSize; // Calcular el offset

        const query = `
            SELECT 
                u.username, 
                u.correo,
                p.nombre AS 'Nombre',
                p.apellido AS 'Apellido'
            FROM usuario u
            INNER JOIN personal p ON u.personal_id = p.id
            WHERE u.isDeleted = 0
            LIMIT ? OFFSET ?
        `;

        const [rows] = await pool.query(query, [pageSize, offset]);
        res.json(rows); // Devuelve los registros con paginación
    } catch (error) {
        console.error('Error: ', error);
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Obtener usuario por ID
export const getUsuarioById = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [rows] = await pool.query("SELECT * FROM usuario WHERE id = ? AND isDeleted = 0", [id]);
        if (rows.length <= 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Eliminar usuario (cambiar estado)
export const deleteUsuario = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query("UPDATE usuario SET isDeleted = 1 WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.sendStatus(204);
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Actualizar usuario
export const updateUsuario = async (req, res) => {
    const { id } = req.params;
    const { username, correo, contrasena, personal_id } = req.body;

    try {
        const updates = {};
        
        if (username !== undefined) updates.username = username;
        if (correo !== undefined) updates.correo = correo;
        if (contrasena !== undefined) {
            const salt = await bcrypt.genSalt(parseInt(SALT_ROUNDS));
            updates.contrasena = await bcrypt.hash(contrasena, salt);
        }
        if (personal_id !== undefined) {
            const [personalExists] = await pool.query("SELECT 1 FROM personal WHERE id = ? AND isDeleted = 0", [personal_id]);
            if (personalExists.length === 0) {
                return res.status(400).json({ message: "Personal no existe o está eliminado" });
            }
            updates.personal_id = personal_id;
        }

        const setClause = Object.keys(updates).map((key) => `${key} = ?`).join(", ");
        const values = Object.values(updates).concat(id);

        if (!setClause) {
            return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
        }

        const [result] = await pool.query(`UPDATE usuario SET ${setClause} WHERE id = ?`, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const [rows] = await pool.query("SELECT * FROM usuario WHERE id = ?", [id]);
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Iniciar sesión
export const loginUser = async (req, res) => {
    const { username, contrasena } = req.body;

    try {
        // Validar largo del username
        if (username.length < 4 || username.length > 25) {
            return res.status(400).json({ message: "El nombre de usuario debe tener entre 4 y 25 caracteres" });
        }

        // Validar existencia del usuario
        const [rows] = await pool.query("SELECT * FROM usuario WHERE username = ? AND isDeleted = 0", [username]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(contrasena, user.contrasena);
        if (!isMatch) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }
        
        // DATOS PARA EL PAYLOAD DEL JWT
        // Obtener rol del usuario
        const [rolRows] = await pool.query("SELECT rp.nombre FROM rol_personal rp JOIN personal p ON rp.id = p.rol_personal_id WHERE p.id = ?", [user.personal_id]);
        const rol = rolRows[0]?.nombre || null;

        // Obtener compañía del usuario
        const [companyRows] = await pool.query("SELECT c.nombre FROM compania c JOIN personal p ON c.id = p.compania_id WHERE p.id = ?", [user.personal_id]);
        const company = companyRows[0]?.nombre || null;

        // Obtener nombre completo del usuario
        const [personalRows] = await pool.query("SELECT nombre, apellido FROM personal WHERE id = ?", [user.personal_id]);
        const nombre = personalRows[0]?.nombre || null;
        const apellido = personalRows[0]?.apellido || null;
        const nombreCompleto = `${nombre} ${apellido}`;

        // obtener imagen del usuario
        const [imageRows] = await pool.query("SELECT img_url FROM personal WHERE id = ?", [user.personal_id]);
        const img_url = imageRows[0]?.img_url || null;
        // ----------------------------
        
        // JSON Web Token
        const token = jwt.sign({
            userId: user.id,
            username: user.username,
            nombre: nombreCompleto,
            rol_personal: rol,
            compania: company,
            img_url: img_url,
        }, SECRET_JWT_KEY, { expiresIn: '5d' }); //por ahora 12 horas de duración para desarrollo

        //En lugar de establecer el token en una cookie,  enviarlo en el cuerpo de la respuesta
        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                nombre: nombreCompleto,
                rol: rol,
                compania: company,
                img_url: img_url,
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Registrar nuevo usuario (incluye verificación de correo)
export const registerUser = async (req, res) => {
    const { username, correo, contrasena, personal_id } = req.body;

    try {
        // Validar existencia del personal
        const [personalExists] = await pool.query("SELECT 1 FROM personal WHERE id = ? AND isDeleted = 0", [personal_id]);
        if (personalExists.length === 0) {
            return res.status(400).json({ message: "Personal no existe o está eliminado" });
        }

        // Validar largo del username
        if (username.length < 4 || username.length > 25) {
            return res.status(400).json({ message: "El nombre de usuario debe tener entre 4 y 25 caracteres" });
        }

        // Validar existencia del usuario
        const [userExists] = await pool.query("SELECT 1 FROM usuario WHERE username = ? AND isDeleted = 0", [username]);
        if (userExists.length > 0) {
            return res.status(400).json({ message: "El nombre de usuario ya está en uso" });
        }

        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(parseInt(SALT_ROUNDS));
        const hashedPassword = await bcrypt.hash(contrasena, salt);

        // Crear el usuario
        const [result] = await pool.query(
            "INSERT INTO usuario (username, correo, contrasena, personal_id, isDeleted, isVerified) VALUES (?, ?, ?, ?, 0, 0)", 
            [username, correo, hashedPassword, personal_id]
        );

        // Obtener el ID del usuario creado
        const userId = result.insertId;

        // Crear un token JWT para la verificación del correo
        const verifyToken = jwt.sign(
            { userId },
            SECRET_JWT_KEY,
            { expiresIn: '1d' } // El token expira en 1 día
        );

        // Crear enlace para la verificación del correo
        const verifyLink = `${HOST}/api/usuario/verify-email/${verifyToken}`;

        // Enviar correo de verificación
        await sendEmail(
            correo,
            'Verificación de Correo',
            `Para verificar tu correo, haz clic en el siguiente enlace: ${verifyLink}`,
            `<p>Para verificar tu correo, haz clic en el siguiente enlace: <a href="${verifyLink}">Verificar Correo</a></p>`
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente. Se ha enviado un correo de verificación.',
            userId: userId,
        });
    } catch (error) {
        console.error('Error al registrar usuario: ', error);
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};


// Recuperar Contraseña (enviar correo con link para cambiar contraseña)
export const recoverPassword = async (req, res) => {
    const { correo } = req.body;

    try {
        // Verificar si el correo existe en la base de datos
        const [userRows] = await pool.query("SELECT * FROM usuario WHERE correo = ? AND isDeleted = 0", [correo]);

        if (userRows.length === 0) {
            return res.status(404).json({ message: "Correo no encontrado" });
        }

        const user = userRows[0];

        // Crear un token JWT que caducará en 1 hora
        const resetToken = jwt.sign(
            { userId: user.id },
            SECRET_JWT_KEY,
            { expiresIn: '1h' }
        );

        // Generar enlace para restablecer la contraseña
        const resetLink = `${HOST}/api/usuario/reset-password/${resetToken}`;

        // Enviar el correo con el enlace de recuperación
        await sendEmail(
            correo, 
            'Recuperación de Contraseña', 
            `Para restablecer tu contraseña, haz clic en el siguiente enlace: ${resetLink}`,
            `<p>Para restablecer tu contraseña, haz clic en el siguiente enlace: <a href="${resetLink}">Restablecer Contraseña</a></p>`
        );

        res.status(200).json({ message: "Correo de recuperación enviado" });

    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Resetear la contraseña
export const resetPassword = async (req, res) => {
    const { token } = req.params;  // Token enviado por el correo
    const { contrasena } = req.body;  // Nueva contraseña

    try {
        // Verificar el token
        const decoded = jwt.verify(token, SECRET_JWT_KEY);

        // Buscar al usuario en la base de datos
        const [userRows] = await pool.query("SELECT * FROM usuario WHERE id = ? AND isDeleted = 0", [decoded.userId]);

        if (userRows.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const user = userRows[0];

        // Encriptar la nueva contraseña
        const salt = await bcrypt.genSalt(parseInt(SALT_ROUNDS));
        const hashedPassword = await bcrypt.hash(contrasena, salt);

        // Actualizar la contraseña en la base de datos
        await pool.query("UPDATE usuario SET contrasena = ? WHERE id = ?", [hashedPassword, user.id]);

        res.status(200).json({ message: "Contraseña restablecida con éxito" });

    } catch (error) {
        return res.status(400).json({ message: "Token inválido o expirado" });
    }
};

// Verificar Correo
export const verifyEmail = async (req, res) => {
    const { token } = req.params;

    try {
        // Verificar el token
        const decoded = jwt.verify(token, SECRET_JWT_KEY);

        // Buscar al usuario en la base de datos
        const [userRows] = await pool.query("SELECT * FROM usuario WHERE id = ? AND isDeleted = 0", [decoded.userId]);

        if (userRows.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const user = userRows[0];

        // Marcar al usuario como verificado
        await pool.query("UPDATE usuario SET isVerified = 1 WHERE id = ?", [user.id]);

        res.status(200).json({ message: "Correo verificado con éxito" });

    } catch (error) {
        return res.status(400).json({ message: "Token inválido o expirado" });
    }
};