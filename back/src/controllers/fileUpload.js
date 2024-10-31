// fileUpload.js
import { Upload } from "@aws-sdk/lib-storage";
import { S3 } from "@aws-sdk/client-s3";
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_BUCKET_NAME } from "../config.js";
import { pool } from "../db.js";


const now = new Date();
const formattedDate = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0'),
  String(now.getHours()).padStart(2, '0'),
  String(now.getMinutes()).padStart(2, '0'),
  String(now.getSeconds()).padStart(2, '0')
].join('');

// S3 Configuration
const s3 = new S3({
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
    region: AWS_REGION,
});

// Function to upload file to S3
export const uploadFileToS3 = async (file, folder) => {
    const params = {
        Bucket: AWS_BUCKET_NAME,
        Key: `${folder}/${formattedDate}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
    };
    return await new Upload({ client: s3, params }).done();
};

// Function to save image URL in the database
export const saveImageUrlToDb = async (url, tableName) => {
    await pool.query(`INSERT INTO ${tableName} (img_url) VALUES (?)`, [url]);
};

// Function to update image URL in the database
export const updateImageUrlInDb = async (id, url, tableName) => {
    await pool.query(`UPDATE ${tableName} SET img_url = ? WHERE id = ?`, [url, id]);
};

// Function to handle errors
export const handleError = (res, error, message) => {
    console.error(message, error);
    res.status(500).json({ message });
};
