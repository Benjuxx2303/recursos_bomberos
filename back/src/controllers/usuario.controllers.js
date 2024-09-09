import { pool } from "../db.js";
import bcrypt from 'bcrypt';

export const getUsuarios = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM usuario");
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
};

export const getUsuariosWithDetails = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                u.username, 
                p.nombre AS 'Nombre',
                p.apellido AS 'Apellido',
                rp.nombre AS 'Rol'
            FROM usuario u
            INNER JOIN personal p ON u.personal_id = p.id AND u.personal_roles_personal_id = p.rol_personal_id
            INNER JOIN rol_personal rp ON p.rol_personal_id = rp.id;
        `);
        res.json(rows);
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
};

// usuario by ID
export const getUsuarioById = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM usuario WHERE id = ?", [req.params.id]);
        if (rows.length <= 0) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
};

// TODO: Validaciones
// TODO: Encriptar contraseñas
export const createUsuario = async (req, res) => {
    const {
        username,
        correo,
        contrasena,
        personal_id,
        personal_roles_personal_id
    } = req.body;

    try {
        const [rows] = await pool.query(
          "INSERT INTO usuario (username, correo, contrasena, personal_id, personal_roles_personal_id) VALUES (?, ?, ?, ?, ?)",
          [
            username,
            correo,
            contrasena,
            personal_id,
            personal_roles_personal_id
        ]);

        res.send({
            id: rows.insertId,
            username,
            correo,
            contrasena,
            personal_id,
            personal_roles_personal_id,
        });
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
};

// TODO: "flag" para eliminar registros?
export const deleteUsuario = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query("DELETE FROM usuario WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }
        res.sendStatus(204);
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
};

// TODO: Validaciones
export const updateUsuario = async (req, res) => {
    const { id } = req.params;
    const {
        username,
        correo,
        contrasena,
        personal_id,
        personal_roles_personal_id
    } = req.body;

    try {
        const [result] = await pool.query(
            "UPDATE usuario SET " +
            "username = IFNULL(?, username), " +
            "correo = IFNULL(?, correo), " +
            "contrasena = IFNULL(?, contrasena), " +
            "personal_id = IFNULL(?, personal_id), " +
            "personal_roles_personal_id = IFNULL(?, personal_roles_personal_id) " +
            "WHERE id = ?",
            [
                username,
                correo,
                contrasena,
                personal_id,
                personal_roles_personal_id,
                id,
            ]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }
        
        const [rows] = await pool.query(
            "SELECT * FROM usuario WHERE id = ?", [id]
        );
        res.json(rows[0]);
    } catch (error) {
        return res.status(500).json({
            message: error
        });
    }
};

// ----------LOGICA DEL LOGIN-------------
// TODO: Comprobar si funciona

const saltRounds = 10;

// funcion de registrar al usuario la tendra el administrador. una vez que este registrado como "personal" podran crear el usuario correspondiente
export const registerUser = async (req, res) => {
    const { username, correo, contrasena, personal_id, personal_roles_personal_id } = req.body;

    try {
        // Encriptar la contraseña antes de guardarla
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(contrasena, salt);

        const [result] = await pool.query(
            "INSERT INTO usuario (username, correo, contrasena, personal_id, personal_roles_personal_id) VALUES (?, ?, ?, ?, ?)",
            [username, correo, hashedPassword, personal_id, personal_roles_personal_id]
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            userId: result.insertId,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || 'Error al registrar el usuario',
        });
    }
};

// TODO: Aplicar autenticacion con JWT
export const loginUser = async (req, res) => {
    const { username, contrasena } = req.body;

    try {
        // Buscar el usuario por su nombre de usuario
        const [rows] = await pool.query("SELECT * FROM usuario WHERE username = ?", [username]);
        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Usuario no encontrado',
            });
        }

        const user = rows[0];
        
        // Comparar la contraseña proporcionada con el hash almacenado
        const isMatch = await bcrypt.compare(contrasena, user.contrasena);
        if (!isMatch) {
            return res.status(401).json({
                message: 'Contraseña incorrecta',
            });
        }

        // Si la contraseña coincide, autenticar al usuario
        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            userId: user.id,
            username: user.username,
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || 'Error al iniciar sesión',
        });
    }
};
