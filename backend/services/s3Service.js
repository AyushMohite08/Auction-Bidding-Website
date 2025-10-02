// src/utils/s3Service.js (CommonJS Version)

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

// !!! IMPORTANT: Use the correct region and bucket name
const REGION = 'ap-south-1'; 
const S3_BUCKET_NAME = 'auction-media-ty4b';

const s3Client = new S3Client({ region: REGION });

async function uploadMediaFile(file) {
    const fileStream = fs.createReadStream(file.path);
    const key = `media/${Date.now()}-${file.originalname}`; 

    const uploadParams = {
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: fileStream,
        ContentType: file.mimetype,
        ACL: 'public-read' 
    };

    try {
        await s3Client.send(new PutObjectCommand(uploadParams));
        
        // Return the public URL
        return `https://${S3_BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
    } catch (error) {
        console.error('S3 Upload Error:', error);
        throw new Error('Failed to upload file to S3.');
    } finally {
        fs.unlink(file.path, (err) => {
            if (err) console.error('Failed to delete temp file:', err);
        });
    }
}

module.exports = { uploadMediaFile };