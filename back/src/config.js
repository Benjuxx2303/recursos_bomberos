import { Buffer } from "buffer";
import { config } from "dotenv";

config();

export const PORT = process.env.PORT || 3000;
export const HOST = process.env.HOST || 'localhost';

export const FRONTEND_HOST = process.env.FRONTEND_HOST || 'http://localhost:3001';

export const SALT_ROUNDS = process.env.SALT_ROUNDS || 10;
export const SECRET_JWT_KEY = process.env.SECRET_JWT_KEY;

export const DB_HOST = process.env.DB_HOST || 'localhost';
export const DB_PORT = process.env.DB_PORT || 3306;
export const DB_USER = process.env.DB_USER || 'root';
export const DB_PASSWORD = process.env.DB_PASSWORD || '';
export const DB_DATABASE = process.env.DB_DATABASE || 'cbo_db_my';

export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
export const AWS_REGION = process.env.AWS_REGION;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;

export const SMTP_SERVICE = process.env.SMTP_SERVICE || 'gmail';  // Nuevo parámetro para el servicio SMTP
export const SMTP_USER = process.env.SMTP_USER;  // Usuario SMTP
export const SMTP_PASS = process.env.SMTP_PASS;  // Contraseña SMTP
export const SMTP_HOST = process.env.SMTP_HOST;  // Host SMTP
export const SMTP_PORT = process.env.SMTP_PORT || 587;  // Puerto SMTP (por defecto 587)
export const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || false;  // Si el servidor usa conexión segura (por defecto false)

export const CERTIFICATE_CA = Buffer.from(process.env.CERTIFICATE_CA, 'base64').toString('utf-8');

export const TOKEN_TEST = process.env.TOKEN_TEST || null;