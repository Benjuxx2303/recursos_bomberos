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
/**
 * Uploads a file to an S3 bucket.
 *
 * @param {Object} file - The file object to be uploaded.
 * @param {string} file.originalname - The original name of the file.
 * @param {Buffer} file.buffer - The buffer containing the file data.
 * @param {string} file.mimetype - The MIME type of the file.
 * @param {string} folder - The folder path within the S3 bucket where the file will be stored.
 * @returns {Promise<Object>} - A promise that resolves to the result of the upload operation.
 */
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
/**
 * Saves an image URL to the specified table and column in the database.
 *
 * @param {string} url - The URL of the image to be saved.
 * @param {string} tableName - The name of the table where the URL will be saved.
 * @param {string} columnName - The name of the column where the URL will be saved.
 * @returns {Promise<void>} A promise that resolves when the URL has been saved to the database.
 */
export const saveImageUrlToDb = async (url, tableName, columnName) => {
    await pool.query(`INSERT INTO ${tableName} (${columnName}) VALUES (?)`, [url]);
};

// Function to update image URL in the database
/**
 * Updates the image URL in the specified database table and column for a given ID.
 *
 * @param {number} id - The ID of the record to update.
 * @param {string} url - The new image URL to set.
 * @param {string} tableName - The name of the table to update.
 * @param {string} columnName - The name of the column to update.
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 */
export const updateImageUrlInDb = async (id, url, tableName, columnName) => {
    await pool.query(`UPDATE ${tableName} SET ${columnName} = ? WHERE id = ?`, [url, id]);
};

// Function to handle errors
export const handleError = (res, error, message) => {
    console.error(message, error);
    res.status(500).json({ message });
};
