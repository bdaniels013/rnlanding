#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('🔄 Setting up database...');
    
    // Push the schema to the database
    console.log('📊 Pushing database schema...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    // Check if we need to seed the database
    console.log('🌱 Checking if database needs seeding...');
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      console.log('🌱 Seeding database with initial data...');
      execSync('node prisma/seed.js', { stdio: 'inherit' });
      console.log('✅ Database seeded successfully!');
    } else {
      console.log('✅ Database already has data, skipping seed.');
    }
    
    console.log('🎉 Database setup complete!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    // Don't exit the process, let the app continue
  } finally {
    await prisma.$disconnect();
  }
}

// Run setup if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export default setupDatabase;
