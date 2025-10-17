// backend/services/s3Service.js
import fs from 'fs';
import path from 'path';

// Create the uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

async function uploadMediaFile(file) {
  const newFileName = `${Date.now()}-${file.originalname}`;
  const newPath = path.join(uploadsDir, newFileName);

  try {
    // Move the file from the temporary location to the final uploads directory
    fs.renameSync(file.path, newPath);

    // Return the local path to the file
    const fileUrl = `/uploads/${newFileName}`;
    console.log(`File saved locally at: ${fileUrl}`);
    return fileUrl;
  } catch (error) {
    console.error('Local File Upload Error:', error);
    // Clean up the temporary file if it still exists
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw new Error('Failed to save file locally.');
  }
}

export { uploadMediaFile };


// // src/services/s3Service.js
// import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// import { createReadStream } from 'fs';

// // !!! IMPORTANT: Use the correct region and bucket name
// const REGION = 'ap-south-1'; 
// const S3_BUCKET_NAME = 'auction-media-ty4b';

// const s3Client = new S3Client({ region: REGION });

// async function uploadMediaFile(file) {
//     const fileStream = createReadStream(file.path);
//     const key = `media/${Date.now()}-${file.originalname}`; 

//     const uploadParams = {
//         Bucket: S3_BUCKET_NAME,
//         Key: key,
//         Body: fileStream,
//         ContentType: file.mimetype,
//         ACL: 'public-read' 
//     };

//     try {
//         await s3Client.send(new PutObjectCommand(uploadParams));
        
//         // Return the public URL
//         return `https://${S3_BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
//     } catch (error) {
//         console.error('S3 Upload Error:', error);
//         throw new Error('Failed to upload file to S3.');
//     } finally {
//         fs.unlink(file.path, (err) => {
//             if (err) console.error('Failed to delete temp file:', err);
//         });
//     }
// }

// export { uploadMediaFile };