import { pool } from "../db.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from "cookie-parser";
import { SALT_ROUNDS, SECRET_JWT_KEY } from "../config.js";

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
            const salt = await bcrypt.genSalt(10);
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
        }, SECRET_JWT_KEY, { expiresIn: '1h' });

        // Configura la cookie y envía la respuesta
        res.cookie('access_token', token, {
            httpOnly: true, // Cookie solo accesible por el servidor
            sameSite: 'strict', // Cookie no accesible por sitios externos
            maxAge: 1000 * 60 * 60, // 1 hora de duración
        });

        return res.status(200).json({
            message: 'Inicio de sesión exitoso',
            userId: user.id,
            username: user.username,
            rol_personal: rol,
        });
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

// Registrar nuevo usuario
export const registerUser = async (req, res) => {
    const { username, correo, contrasena, personal_id } = req.body;

    try {
        // Validar existencia del personal
        const [personalExists] = await pool.query("SELECT 1 FROM personal WHERE id = ? AND isDeleted = 0", [personal_id]);
        if (personalExists.length === 0) {
            return res.status(400).json({ message: "Personal no existe o está eliminado" });
        }

        // Validar largo del username
        if(username.length < 4 || username.length > 25) {
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

        const [result] = await pool.query(
            "INSERT INTO usuario (username, correo, contrasena, personal_id, isDeleted) VALUES (?, ?, ?, ?, 0)",
            [username, correo, hashedPassword, personal_id]
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            userId: result.insertId,
        });
    } catch (error) {
        console.error('Error: ', error);
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};