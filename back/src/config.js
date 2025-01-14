import { Buffer } from "buffer";
import { config } from "dotenv";

config()

export const PORT= process.env.PORT || 3000;
export const HOST= process.env.HOST || 'localhost';

export const SALT_ROUNDS= process.env.SALT_ROUNDS || 10;
export const SECRET_JWT_KEY = process.env.SECRET_JWT_KEY;

export const DB_HOST= process.env.DB_HOST || 'localhost';
export const DB_PORT= process.env.DB_PORT || 3306;
export const DB_USER= process.env.DB_USER || 'root';
export const DB_PASSWORD= process.env.DB_PASSWORD || '';
export const DB_DATABASE=process.env.DB_DATABASE || 'cbo_db_my';

export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
export const AWS_REGION = process.env.AWS_REGION;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;

export const GMAIL_USER = process.env.GMAIL_USER;
export const GMAIL_PASS = process.env.GMAIL_PASS;

export const TOKEN_TEST = process.env.TOKEN_TEST || null;

export const CERTIFICATE_CA = Buffer.from(process.env.CERTIFICATE_CA, 'base64').toString('utf-8');