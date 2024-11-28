import { config } from "dotenv";

config()

export const PORT= process.env.PORT || 3000;
export const HOST= process.env.HOST || 'localhost';

export const DB_HOST= process.env.DB_HOST || 'localhost';
export const DB_PORT= process.env.DB_PORT || 3306;
export const DB_USER= process.env.DB_USER || 'root';
export const DB_PASSWORD= process.env.DB_PASSWORD || '';
export const DB_DATABASE=process.env.DB_DATABASE || 'cbo_db_my';

export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
export const AWS_REGION = process.env.AWS_REGION;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
