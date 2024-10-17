import { pool } from "../db.js";
import bcrypt from 'bcrypt';

// Obtener todos los usuarios
export const getUsuarios = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM usuario WHERE isDeleted = 0");
        res.json(rows);
    } catch (error) {
        return res.status(500).json({ message: error.message });
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
        return res.status(500).json({ message: error.message });
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
        return res.status(500).json({ message: error.message });
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
        return res.status(500).json({ message: error.message });
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
        return res.status(500).json({ message: error.message });
    }
};

// Iniciar sesión
export const loginUser = async (req, res) => {
    const { username, contrasena } = req.body;

    try {
        const [rows] = await pool.query("SELECT * FROM usuario WHERE username = ? AND isDeleted = 0", [username]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(contrasena, user.contrasena);
        if (!isMatch) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        res.status(200).json({ message: 'Inicio de sesión exitoso', userId: user.id, username: user.username });
    } catch (error) {
        return res.status(500).json({ message: error.message });
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

        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
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
        return res.status(500).json({ message: error.message || 'Error al registrar el usuario' });
    }
};