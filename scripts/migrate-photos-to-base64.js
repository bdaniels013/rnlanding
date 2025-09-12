import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migratePhotosToBase64() {
  try {
    console.log('🔄 Starting photo migration to base64...');
    
    // Get all photos that don't have imageData yet
    const photos = await prisma.socialMediaPhoto.findMany({
      where: {
        imageData: null
      }
    });
    
    console.log(`📸 Found ${photos.length} photos to migrate`);
    
    for (const photo of photos) {
      try {
        let imageData = null;
        
        // Check if it's a local file path
        if (photo.url.startsWith('/uploads/') || photo.url.startsWith('/assets/')) {
          const filePath = path.join(__dirname, '..', 'public', photo.url);
          
          if (fs.existsSync(filePath)) {
            const fileBuffer = fs.readFileSync(filePath);
            const mimeType = getMimeType(photo.filename);
            imageData = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
            console.log(`✅ Converted ${photo.filename} to base64`);
          } else {
            console.log(`⚠️  File not found: ${filePath}`);
          }
        }
        
        // Update the photo with base64 data
        await prisma.socialMediaPhoto.update({
          where: { id: photo.id },
          data: { imageData }
        });
        
      } catch (error) {
        console.error(`❌ Error processing ${photo.filename}:`, error.message);
      }
    }
    
    console.log('✅ Photo migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  return mimeTypes[ext] || 'image/jpeg';
}

migratePhotosToBase64();
