import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { HOST, SALT_ROUNDS, SECRET_JWT_KEY } from "../config.js";
import { pool } from "../db.js";
import { generateEmailTemplate, sendEmail } from '../utils/mailer.js';
import { checkIfDeletedById, checkIfExists, checkIfExistsForUpdate } from "../utils/queries.js";
import { validateEmail, validatePassword, validateUsername } from '../utils/validations.js';


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
                ORDER BY u.id DESC
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
            ORDER BY u.id DESC
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
    let { username, correo, contrasena, personal_id } = req.body;

    const errors = []; // Array para capturar errores

    try {
        const updates = {};

        if (username !== undefined){
            username = username.trim();
            // Validar largo del username
            validateUsername(username, errors);

            // Validar existencia del username
            await checkIfExistsForUpdate(pool, username, "username", "usuario", id, errors);
            updates.username = username;
        }

        if (correo !== undefined){
            correo = correo.trim();
            // Validar formato del correo
            if (!validateEmail(correo)) {
                errors.push("Correo inválido");
            } 
            updates.correo = correo;
        }

        if (contrasena !== undefined) {
            contrasena = contrasena.trim();
            validatePassword(contrasena, errors);
            const salt = await bcrypt.genSalt(parseInt(SALT_ROUNDS));
            updates.contrasena = await bcrypt.hash(contrasena, salt);
        }

        if (personal_id !== undefined) {
            checkIfDeletedById(pool, personal_id, "personal", errors)
            updates.personal_id = personal_id;
        }

        
        const setClause = Object.keys(updates).map((key) => `${key} = ?`).join(", ");
        const values = Object.values(updates).concat(id);
        
        if (!setClause) {
            return res.status(400).json({ message: "No se proporcionaron campos para actualizar" });
        }
        
        if (errors.length > 0) {
            // Si existen errores, devolverlos sin proceder con la actualización
            return res.status(400).json({ errors });
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
    let { username, contrasena } = req.body;
    let errors = [];  // Inicializamos un array para almacenar los errores.

    try {
        // Validar largo del username o correo
        if (username.length < 4 || username.length > 50) {
            errors.push("El nombre de usuario o correo debe tener entre 4 y 50 caracteres");
        }
        // Elimina espacios en blanco al inicio y al final del username
        username = username.trim();
        // Eliminar espacios en blanco al inicio y al final de la contraseña
        contrasena = contrasena.trim();

        // Validar existencia del usuario por username o correo
        const [rows] = await pool.query( // al usar  el * se estaba tomando el id como de la tabla personal en vez de la tabla usuario.
            "SELECT u.*, p.*, u.id AS user_id FROM usuario u JOIN personal p ON u.personal_id = p.id WHERE (u.username = ? OR u.correo = ? OR p.rut= ?) AND u.isDeleted = 0", 
            [username, username, username] 
        );
        if (rows.length === 0) {
            errors.push('Usuario no encontrado');
        }

        // Si hay errores en el usuario, devolverlos.
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

   

        const user = rows[0];
        const isMatch = await bcrypt.compare(contrasena, user.contrasena);
        if (!isMatch) {
            errors.push('Contraseña incorrecta');
        }

        // Si hay errores en la contraseña, devolverlos.
        if (errors.length > 0) {
            return res.status(400).json({ errors });
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

        // Obtener imagen del usuario
        const [imageRows] = await pool.query("SELECT img_url FROM personal WHERE id = ?", [user.personal_id]);
        const img_url = imageRows[0]?.img_url || null;

        //Obtener rol_personal_id del usuario
        const [rol_personal_idRows] = await pool.query("SELECT rol_personal_id , compania_id FROM personal WHERE id = ?", [user.personal_id]);
        const rol_personal_id = rol_personal_idRows[0]?.rol_personal_id || null;
        const compania_id = rol_personal_idRows[0]?.compania_id || null;


        // JSON Web Token
        const token = jwt.sign({
            userId: user.user_id,
            username: user.username,
            personal_id: user.personal_id,
            correo: user.correo,
            nombre: nombreCompleto,
            rol_personal: rol,
            compania: company,
            compania_id: compania_id,
            img_url: img_url,
            rol_personal_id: rol_personal_id,
        }, SECRET_JWT_KEY, { expiresIn: '7d' }); //por ahora 5 días de duración para desarrollo

        // Enviar el token y la información del usuario.
        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            token: token,
            user: {
                id: user.user_id,
                username: user.username,
                personal_id: user.personal_id,
                correo:user.correo,
                nombre: nombreCompleto,
                rol: rol,
                compania: company,
                compania_id: compania_id,
                img_url: img_url,
                rol_personal_id: rol_personal_id,
            }
        });
    } catch (error) {
        console.error('Error al iniciar sesión: ', error);
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Registrar nuevo usuario (incluye verificación de correo)
export const registerUser = async (req, res) => {
    let { username, correo, contrasena, personal_id } = req.body;
    let errors = []; // Array para capturar los errores

    try {
        // eliminar espacios en los campos de texto
        username = username.trim();
        correo = correo.trim();
        contrasena = contrasena.trim();

        // Validar formato del correo
        if (!validateEmail(correo)) {
            errors.push("Correo inválido");
        }

        // validar contraseña
        validatePassword(contrasena, errors);
        
        // Validar username
        validateUsername(username, errors);

        // Validar existencia del usuario
        checkIfExists(pool, username, "username", "usuario", errors);

        // Validar existencia del personal
        checkIfDeletedById(pool, personal_id, "personal", errors);

        // Si hay errores, devolvemos la lista sin ejecutar el resto de la función
        if (errors.length > 0) {
            return res.status(400).json({ message: "Errores en los campos", errors });
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

        // Generar contenido HTML para el correo
        const htmlContent = generateEmailTemplate(
            'Verificación de Correo',
            'Verificar Correo',
            verifyLink
        );

        // Enviar correo de verificación
        await sendEmail(
            correo,
            'Verificación de Correo',
            `Para verificar tu correo, haz clic en el siguiente enlace: ${verifyLink}`,
            htmlContent
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
    let { correo } = req.body;
    let errors = [];

    try {
        correo = correo.trim();

        // Validar formato del correo
        if (!validateEmail(correo)) {
            errors.push("Correo inválido");
        }

        // Verificar si el correo existe en la base de datos y obtener información del usuario
        const [userRows] = await pool.query(
            `SELECT u.id, u.correo, p.nombre, p.apellido 
             FROM usuario u 
             INNER JOIN personal p ON u.personal_id = p.id 
             WHERE u.correo = ? AND u.isDeleted = 0`,
            [correo]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ 
                message: "No se encontró una cuenta con este correo electrónico" 
            });
        }

        const user = userRows[0];
        const nombreCompleto = `${user.nombre} ${user.apellido}`;

        // Crear un token JWT que caducará en 1 hora
        const resetToken = jwt.sign(
            { 
                userId: user.id,
                email: user.correo,
                type: 'password-reset'
            },
            SECRET_JWT_KEY,
            { expiresIn: '1h' }
        );

        // Generar enlace para restablecer la contraseña
        const resetLink = `${process.env.FRONTEND_URL}/restablecer-contrasena?token=${resetToken}`;

        // Generar contenido HTML para el correo
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #e53e3e;">Recuperación de Contraseña</h2>
                <p>Hola ${nombreCompleto},</p>
                <p>Has solicitado restablecer tu contraseña. Utiliza el siguiente enlace para crear una nueva contraseña:</p>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                    <tr>
                        <td align="center">
                            <a href="${resetLink}" 
                               style="background-color: #e53e3e; 
                                      color: #ffffff; 
                                      display: inline-block; 
                                      padding: 12px 24px; 
                                      text-decoration: none; 
                                      border-radius: 5px;
                                      font-weight: bold;">
                                Restablecer Contraseña
                            </a>
                        </td>
                    </tr>
                </table>
                <p>O copia y pega el siguiente enlace en tu navegador:</p>
                <p style="word-break: break-all; color: #2563eb;">${resetLink}</p>
                <p style="color: #666;">Este enlace expirará en 1 hora por razones de seguridad.</p>
                <p style="color: #666;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
                <hr style="margin: 20px 0; border: 1px solid #eee;">
                <p style="font-size: 12px; color: #999;">Este es un correo automático, por favor no respondas a este mensaje.</p>
            </div>
        `;

        // Enviar el correo con el enlace de recuperación
        await sendEmail(
            correo, 
            'Recuperación de Contraseña - Bomberos', 
            `Para restablecer tu contraseña, visita: ${resetLink}`,
            htmlContent
        );

        // Guardar el token en la base de datos
        await pool.query(
            'UPDATE usuario SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?',
            [resetToken, user.id]
        );

        res.status(200).json({ 
            message: "Se ha enviado un correo con las instrucciones para restablecer tu contraseña" 
        });

    } catch (error) {
        console.error('Error en recoverPassword:', error);
        return res.status(500).json({ 
            message: "Error al procesar la solicitud de recuperación de contraseña",
            error: error.message 
        });
    }
};

// Verificar token de restablecimiento
export const verifyResetToken = async (req, res) => {
    const { token } = req.body;

    try {
        if (!token) {
            return res.status(400).json({ message: "Token no proporcionado" });
        }

        // Verificar el token
        const decoded = jwt.verify(token, SECRET_JWT_KEY);

        // Verificar que sea un token de restablecimiento de contraseña
        if (decoded.type !== 'password-reset') {
            return res.status(400).json({ message: "Token inválido" });
        }

        // Verificar que el usuario existe y el token no ha expirado
        const [userRows] = await pool.query(
            "SELECT id FROM usuario WHERE id = ? AND reset_token = ? AND reset_token_expires > NOW() AND isDeleted = 0",
            [decoded.userId, token]
        );

        if (userRows.length === 0) {
            return res.status(400).json({ message: "Token inválido o expirado" });
        }

        res.status(200).json({ message: "Token válido" });
    } catch (error) {
        console.error('Error al verificar token:', error);
        return res.status(400).json({ message: "Token inválido o expirado" });
    }
};

// Resetear la contraseña
export const resetPassword = async (req, res) => {
    const { token, contrasena } = req.body;
    let errors = [];

    try {
        if (!token || !contrasena) {
            return res.status(400).json({ message: "Token y contraseña son requeridos" });
        }

        // Validar contraseña
        validatePassword(contrasena.trim(), errors);

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        try {
            // Verificar el token
            const decoded = jwt.verify(token, SECRET_JWT_KEY);

            // Verificar que sea un token de restablecimiento de contraseña
            if (decoded.type !== 'password-reset') {
                return res.status(400).json({ message: "Token inválido" });
            }

            // Verificar que el usuario existe y el token no ha expirado
            const [userRows] = await pool.query(
                "SELECT id FROM usuario WHERE id = ? AND reset_token = ? AND reset_token_expires > NOW() AND isDeleted = 0",
                [decoded.userId, token]
            );

            if (userRows.length === 0) {
                return res.status(400).json({ message: "Token inválido o expirado" });
            }

            // Encriptar la nueva contraseña
            const salt = await bcrypt.genSalt(parseInt(SALT_ROUNDS));
            const hashedPassword = await bcrypt.hash(contrasena.trim(), salt);

            // Actualizar la contraseña y limpiar el token
            await pool.query(
                "UPDATE usuario SET contrasena = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
                [hashedPassword, decoded.userId]
            );

            res.status(200).json({ message: "Contraseña actualizada correctamente" });
        } catch (jwtError) {
            console.error('Error al verificar token:', jwtError);
            return res.status(400).json({ message: "Token inválido o expirado" });
        }
    } catch (error) {
        console.error('Error al resetear contraseña:', error);
        return res.status(500).json({ 
            message: "Error al restablecer la contraseña",
            error: error.message 
        });
    }
};
    
// Verificar Correo
export const verifyEmail = async (req, res) => {
    const { token } = req.params;
    let errors = []; // Array para capturar los errores

    try {
        // Verificar que el token no esté vacío
        if (!token) {
            errors.push("Token es requerido");
        }

        // Si hay errores, devolver la lista sin ejecutar el resto de la función
        if (errors.length > 0) {
            return res.status(400).json({ message: "Errores en los campos", errors });
        }

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
        console.error('Error al verificar correo: ', error);
        return res.status(400).json({ message: "Token inválido o expirado" });
    }
};

// Crear usuario (solo para usuarios autorizados)
export const createUser = async (req, res) => {
    let { username, personal_id } = req.body;
    let errors = [];

    try {
        // Verificar si ya existe un usuario para este personal
        const [existingUser] = await pool.query(
            "SELECT id FROM usuario WHERE personal_id = ? AND isDeleted = 0",
            [personal_id]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ 
                message: "Ya existe un usuario asociado a este personal" 
            });
        }

        // Obtener información del personal
        const [personalInfo] = await pool.query(
            `SELECT 
                p.nombre, 
                p.apellido, 
                p.correo,
                c.nombre as compania_nombre
            FROM personal p
            LEFT JOIN compania c ON p.compania_id = c.id
            WHERE p.id = ? AND p.isDeleted = 0`,
            [personal_id]
        );

        if (personalInfo.length === 0) {
            return res.status(404).json({ message: "Personal no encontrado" });
        }

        const { nombre, apellido, correo, compania_nombre } = personalInfo[0];

        // Si no se proporciona username, generarlo automáticamente
        if (!username) {
            const companiaInitials = compania_nombre ? compania_nombre.split(' ').map(word => word[0]).join('') : '';
            const nombreInitial = nombre ? nombre[0] : '';
            const apellidoInitial = apellido ? apellido[0] : '';
            let baseUsername = `${companiaInitials}${nombreInitial}${apellidoInitial}`.toLowerCase();
            let tempUsername = baseUsername;
            let counter = 1;
            let abc = 'abcdefghijklmnopqrstuvwxyz';
            let abcIndex = 0;
            while (true) {
                const [exists] = await pool.query(
                    "SELECT id FROM usuario WHERE username = ? AND isDeleted = 0",
                    [tempUsername]
                );
                if (exists.length === 0) break;
                // Agrega letra y número incremental para mayor robustez
                tempUsername = `${baseUsername}${abc[abcIndex]}${counter}`;
                counter++;
                if (abcIndex < abc.length - 1) {
                    abcIndex++;
                } else {
                    abcIndex = 0;
                }
            }
            username = tempUsername;
        } else {
            // Si se proporciona username, verificar que no exista
            const [usernameExists] = await pool.query(
                "SELECT id FROM usuario WHERE username = ? AND isDeleted = 0",
                [username]
            );
            if (usernameExists.length > 0) {
                return res.status(400).json({
                    message: "El nombre de usuario ya está en uso, por favor elige otro."
                });
            }
        }

        // Validar username
        validateUsername(username, errors);

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Generar contraseña provisional aleatoria
        const provisionalPassword = Math.random().toString(36).slice(-8);
        
        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(parseInt(SALT_ROUNDS));
        const hashedPassword = await bcrypt.hash(provisionalPassword, salt);

        // Crear el usuario
        const [result] = await pool.query(
            "INSERT INTO usuario (username, correo, contrasena, personal_id, isDeleted, isVerified) VALUES (?, ?, ?, ?, 0, 1)",
            [username, correo, hashedPassword, personal_id]
        );

        // Crear token para cambio de contraseña
        const changePasswordToken = jwt.sign(
            { 
                userId: result.insertId,
                email: correo,
                type: 'password-change'
            },
            SECRET_JWT_KEY,
            { expiresIn: '24h' }
        );

        // Generar enlace para cambiar la contraseña
        const changePasswordLink = `${process.env.FRONTEND_URL}/cambiar-contrasena?token=${changePasswordToken}`;

        // Generar contenido HTML para el correo
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #e53e3e;">Cuenta Creada - Bomberos</h2>
                <p>Hola ${nombre} ${apellido},</p>
                <p>Se ha creado una cuenta para ti en el sistema. Tus credenciales son:</p>
                <ul>
                    <li>Usuario: ${username}</li>
                    <li>Contraseña provisional: ${provisionalPassword}</li>
                </ul>
                <p>Por seguridad, debes cambiar tu contraseña usando el siguiente enlace:</p>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                    <tr>
                        <td align="center">
                            <a href="${changePasswordLink}" 
                               style="background-color: #e53e3e; 
                                      color: #ffffff; 
                                      display: inline-block; 
                                      padding: 12px 24px; 
                                      text-decoration: none; 
                                      border-radius: 5px;
                                      font-weight: bold;">
                                Cambiar Contraseña
                            </a>
                        </td>
                    </tr>
                </table>
                <p>O copia y pega el siguiente enlace en tu navegador:</p>
                <p style="word-break: break-all; color: #2563eb;">${changePasswordLink}</p>
                <p style="color: #666;">Este enlace expirará en 24 horas por razones de seguridad.</p>
                <hr style="margin: 20px 0; border: 1px solid #eee;">
                <p style="font-size: 12px; color: #999;">Este es un correo automático, por favor no respondas a este mensaje.</p>
            </div>
        `;

        // Enviar correo con las credenciales
        await sendEmail(
            correo,
            'Cuenta Creada - Bomberos',
            `Se ha creado tu cuenta. Usuario: ${username}, Contraseña: ${provisionalPassword}. Cambia tu contraseña en: ${changePasswordLink}`,
            htmlContent
        );

        res.status(201).json({
            message: 'Usuario creado exitosamente. Se han enviado las credenciales por correo.',
            userId: result.insertId,
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        return res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Cambiar contraseña (para usuarios nuevos)
export const changePassword = async (req, res) => {
    const { token, contrasena } = req.body;
    let errors = [];

    console.log('Recibida solicitud de cambio de contraseña:', {
        tokenPresent: !!token,
        contrasenaPresent: !!contrasena
    });

    try {
        if (!token || !contrasena) {
            console.log('Faltan datos requeridos');
            return res.status(400).json({ message: "Token y contraseña son requeridos" });
        }

        // Validar contraseña
        validatePassword(contrasena.trim(), errors);

        if (errors.length > 0) {
            console.log('Errores de validación:', errors);
            return res.status(400).json({ errors });
        }

        try {
            // Verificar el token
            console.log('Verificando token...');
            const decoded = jwt.verify(token, SECRET_JWT_KEY);
            console.log('Token decodificado:', {
                userId: decoded.userId,
                type: decoded.type
            });

            // Verificar que sea un token de cambio de contraseña
            if (decoded.type !== 'password-change') {
                console.log('Tipo de token incorrecto:', decoded.type);
                return res.status(400).json({ message: "Token inválido" });
            }

            // Encriptar la nueva contraseña
            const salt = await bcrypt.genSalt(parseInt(SALT_ROUNDS));
            const hashedPassword = await bcrypt.hash(contrasena.trim(), salt);

            // Actualizar la contraseña
            console.log('Actualizando contraseña para usuario:', decoded.userId);
            const [result] = await pool.query(
                "UPDATE usuario SET contrasena = ? WHERE id = ? AND isDeleted = 0",
                [hashedPassword, decoded.userId]
            );

            if (result.affectedRows === 0) {
                console.log('No se encontró el usuario');
                return res.status(404).json({ message: "Usuario no encontrado" });
            }

            console.log('Contraseña actualizada exitosamente');
            res.status(200).json({ message: "Contraseña actualizada correctamente" });

        } catch (jwtError) {
            console.error('Error al verificar token:', jwtError);
            return res.status(400).json({ message: "Token inválido o expirado" });
        }

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        return res.status(500).json({ 
            message: "Error al cambiar la contraseña",
            error: error.message 
        });
    }
};

// Cambiar contraseña de usuario por parte de un administrador
export const adminResetPassword = async (req, res) => {
    const { userId, newPassword } = req.body;
    let errors = [];

    console.log('Recibida solicitud de cambio de contraseña por administrador:', {
        userIdPresent: !!userId,
        newPasswordPresent: !!newPassword
    });

    try {
        if (!userId || !newPassword) {
            console.log('Faltan datos requeridos');
            return res.status(400).json({ message: "ID de usuario y nueva contraseña son requeridos" });
        }

        // Validar contraseña
        validatePassword(newPassword.trim(), errors);

        if (errors.length > 0) {
            console.log('Errores de validación:', errors);
            return res.status(400).json({ errors });
        }

        // Verificar que el usuario exista
        const [userExists] = await pool.query(
            "SELECT id FROM usuario WHERE id = ? AND isDeleted = 0",
            [userId]
        );

        if (userExists.length === 0) {
            console.log('Usuario no encontrado:', userId);
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Encriptar la nueva contraseña
        const salt = await bcrypt.genSalt(parseInt(SALT_ROUNDS));
        const hashedPassword = await bcrypt.hash(newPassword.trim(), salt);

        // Actualizar la contraseña
        console.log('Actualizando contraseña para usuario:', userId);
        const [result] = await pool.query(
            "UPDATE usuario SET contrasena = ? WHERE id = ? AND isDeleted = 0",
            [hashedPassword, userId]
        );

        if (result.affectedRows === 0) {
            console.log('No se pudo actualizar la contraseña');
            return res.status(500).json({ message: "Error al actualizar la contraseña" });
        }

        // Obtener información del usuario para enviar correo
        const [userData] = await pool.query(
            "SELECT u.correo, p.nombre, p.apellido FROM usuario u JOIN personal p ON u.personal_id = p.id WHERE u.id = ?",
            [userId]
        );

        if (userData.length > 0) {
            // Enviar correo de notificación
            try {
                const emailData = {
                    to: userData[0].correo,
                    subject: "Tu contraseña ha sido actualizada",
                    html: generateEmailTemplate({
                        title: "Contraseña Actualizada",
                        name: `${userData[0].nombre} ${userData[0].apellido}`,
                        message: "Un administrador ha actualizado tu contraseña. Por favor, inicia sesión con tu nueva contraseña.",
                        buttonText: "Iniciar Sesión",
                        buttonUrl: `${HOST}/login`
                    })
                };
                await sendEmail(emailData);
                console.log('Correo de notificación enviado a:', userData[0].correo);
            } catch (emailError) {
                console.error('Error al enviar correo de notificación:', emailError);
                // No interrumpimos el flujo si falla el envío del correo
            }
        }

        console.log('Contraseña actualizada exitosamente por administrador');
        res.status(200).json({ message: "Contraseña actualizada correctamente" });

    } catch (error) {
        console.error('Error al cambiar contraseña por administrador:', error);
        return res.status(500).json({ 
            message: "Error al cambiar la contraseña",
            error: error.message 
        });
    }
};