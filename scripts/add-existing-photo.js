import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addExistingPhoto() {
  try {
    // Add the existing screenshot to the database
    const existingPhoto = await prisma.socialMediaPhoto.create({
      data: {
        platform: 'youtube', // This appears to be a YouTube analytics screenshot
        filename: 'Screen Shot 2025-08-31 at 11.27.19 PM.png',
        originalName: 'Screen Shot 2025-08-31 at 11.27.19 PM.png',
        url: '/assets/Screen Shot 2025-08-31 at 11.27.19 PM.png',
        altText: "Rich Nick's YouTube Analytics - Real View Counts & Performance",
        order: 0,
        isActive: true
      }
    });

    console.log('✅ Existing photo added to database:', existingPhoto);
    
    // Also add the "rn views.jpg" image
    const viewsPhoto = await prisma.socialMediaPhoto.create({
      data: {
        platform: 'youtube',
        filename: 'rn views.jpg',
        originalName: 'rn views.jpg',
        url: '/assets/rn views.jpg',
        altText: "Rich Nick's View Counts & Analytics",
        order: 1,
        isActive: true
      }
    });

    console.log('✅ Views photo added to database:', viewsPhoto);
    
  } catch (error) {
    console.error('❌ Error adding existing photos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addExistingPhoto();
